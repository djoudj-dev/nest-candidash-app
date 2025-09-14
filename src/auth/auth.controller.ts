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
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response as ExpressResponse } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, RefreshResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import type { RequestWithCookies, AuthenticatedRequest } from './interfaces';
import { AuthMapper } from './mappers';
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
  constructor(private readonly authService: AuthService) {}

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

    // Retourner seulement l'access token et les données utilisateur
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
    // Récupérer le refresh token depuis les cookies
    const refreshToken = req.cookies?.refresh_token;

    if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
      throw new UnauthorizedException(
        'Jeton de renouvellement introuvable ou invalide dans les cookies',
      );
    }

    const authResult = await this.authService.refreshToken(refreshToken);

    // Définir le nouveau refresh token dans le cookie
    response.cookie('refresh_token', authResult.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    // Retourner seulement l'access token
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
    // Clear le cookie refresh token
    response.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    return this.authService.logout(req.user.sub);
  }
}
