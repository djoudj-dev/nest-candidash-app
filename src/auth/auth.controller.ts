import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  HttpCode,
  UseGuards,
  Req,
  Res,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response as ExpressResponse } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import {
  RegisterDto,
  VerifyRegistrationDto,
  ResendVerificationCodeDto,
} from './dto/register.dto';
import { AuthResponseDto, RefreshResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import type { RequestWithCookies, AuthenticatedRequest } from './interfaces';
import { AuthMapper } from './mappers';
import { VerificationService } from './services/verification.service';
import { PendingUserService } from './services/pending-user.service';
import {
  ApiAuthOperation,
  ApiAuthenticatedOperation,
  ApiLoginResponse,
  ApiRefreshResponse,
  ApiLogoutResponse,
} from './decorators/api-decorators';

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly verificationService: VerificationService,
    private readonly pendingUserService: PendingUserService,
  ) {}

  @Post('login')
  @HttpCode(200)
  @ApiAuthOperation("Authentifier l'utilisateur et obtenir un jeton d'accès")
  @ApiLoginResponse()
  async login(
    @Body(ValidationPipe) loginDto: LoginDto,
    @Res({ passthrough: true }) response: ExpressResponse,
  ): Promise<AuthResponseDto> {
    const authResult = await this.authService.login(loginDto);

    // Définir le refresh token dans un cookie HttpOnly
    response.cookie('refresh_token', authResult.refresh_token, {
      httpOnly: true, // Inaccessible au JavaScript
      secure: process.env.NODE_ENV === 'production', // HTTPS en prod
      sameSite: 'strict', // Protection CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours en milliseconds
      path: '/',
    });

    return AuthMapper.mapAuthResultToLoginResponse(authResult);
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiAuthOperation(
    "Renouveler le jeton d'accès avec un jeton de renouvellement",
  )
  @ApiRefreshResponse()
  async refresh(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) response: ExpressResponse,
  ): Promise<RefreshResponseDto> {
    const refreshToken = req.cookies?.refresh_token;

    if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
      throw new UnauthorizedException(
        'Jeton de renouvellement introuvable ou invalide dans les cookies',
      );
    }

    const authResult = await this.authService.refreshToken(refreshToken);

    response.cookie('refresh_token', authResult.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return AuthMapper.mapAuthResultToRefreshResponse(authResult);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @ApiAuthenticatedOperation(
    "Déconnecter l'utilisateur et invalider le jeton de renouvellement",
  )
  @ApiLogoutResponse()
  async logout(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) response: ExpressResponse,
  ): Promise<{ message: string }> {
    response.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    return this.authService.logout(req.user.sub);
  }

  @Post('register')
  @HttpCode(201)
  @ApiAuthOperation(
    "Initier le processus d'inscription et envoyer un code de validation",
  )
  async register(
    @Body(ValidationPipe) registerDto: RegisterDto,
  ): Promise<{ message: string; email: string }> {
    let hasEmailSendError: boolean = false;
    try {
      await this.pendingUserService.createPendingUser({
        email: registerDto.email,
        password: registerDto.password,
        username: registerDto.username,
      });
      const verificationCode: string =
        this.verificationService.generateVerificationCode();
      await this.verificationService.saveVerificationCode(
        registerDto.email,
        verificationCode,
      );
      const emailSent: boolean =
        await this.verificationService.sendVerificationEmail(
          registerDto.email,
          verificationCode,
        );
      if (emailSent) {
        return {
          message:
            'Code de validation envoyé par email. Veuillez vérifier votre boîte de réception.',
          email: registerDto.email,
        };
      }
      hasEmailSendError = true;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException("Erreur lors du processus d'inscription");
    }
    if (hasEmailSendError) {
      throw new BadRequestException(
        "Erreur lors de l'envoi du code de validation",
      );
    }
    // Fallback par sécurité, ne devrait pas être atteint
    throw new BadRequestException("Erreur lors du processus d'inscription");
  }

  @Post('verify-registration')
  @HttpCode(200)
  @ApiAuthOperation(
    "Valider le code de vérification et finaliser l'inscription",
  )
  async verifyRegistration(
    @Body(ValidationPipe) verifyDto: VerifyRegistrationDto,
    @Res({ passthrough: true }) response: ExpressResponse,
  ): Promise<AuthResponseDto> {
    const isValidCode = await this.verificationService.verifyCode(
      verifyDto.email,
      verifyDto.verificationCode,
    );

    if (!isValidCode) {
      throw new BadRequestException('Code de validation invalide ou expiré');
    }

    const pendingUserExists = await this.pendingUserService.findPendingUser(
      verifyDto.email,
    );
    if (!pendingUserExists) {
      throw new BadRequestException(
        'Aucune inscription en attente pour cet email',
      );
    }

    const { password } = await this.pendingUserService.validatePendingUser(
      verifyDto.email,
    );

    const authResult = await this.authService.login({
      email: verifyDto.email,
      password: password,
    });

    response.cookie('refresh_token', authResult.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      path: '/',
    });

    return AuthMapper.mapAuthResultToLoginResponse(authResult);
  }

  @Post('resend-verification')
  @HttpCode(200)
  @ApiAuthOperation('Renvoyer un code de validation')
  async resendVerificationCode(
    @Body(ValidationPipe) resendDto: ResendVerificationCodeDto,
  ): Promise<{ message: string }> {
    const canResend = await this.verificationService.canResendCode(
      resendDto.email,
    );
    if (!canResend) {
      throw new BadRequestException(
        'Veuillez attendre au moins une minute avant de demander un nouveau code',
      );
    }

    const pendingUserExists = await this.pendingUserService.findPendingUser(
      resendDto.email,
    );
    if (!pendingUserExists) {
      throw new BadRequestException(
        'Aucune inscription en attente pour cet email',
      );
    }

    const verificationCode =
      this.verificationService.generateVerificationCode();
    await this.verificationService.saveVerificationCode(
      resendDto.email,
      verificationCode,
    );

    const emailSent = await this.verificationService.sendVerificationEmail(
      resendDto.email,
      verificationCode,
    );

    if (!emailSent) {
      throw new BadRequestException(
        "Erreur lors de l'envoi du code de validation",
      );
    }

    return {
      message: 'Nouveau code de validation envoyé par email',
    };
  }
}
