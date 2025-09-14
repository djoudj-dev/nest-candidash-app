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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, RefreshResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

interface RequestWithCookies extends ExpressRequest {
  cookies: Record<string, string | undefined>;
}

interface AuthenticatedRequest extends ExpressRequest {
  user: { sub: string };
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: "Authentifier l'utilisateur et obtenir un jeton d'accès",
  })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur authentifié avec succès',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Identifiants invalides' })
  @ApiResponse({ status: 400, description: "Données d'entrée invalides" })
  async login(
    @Body(ValidationPipe) loginDto: LoginDto,
    @Res({ passthrough: true }) response: ExpressResponse,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.login(loginDto);

    // Définir le refresh token dans un cookie HttpOnly
    response.cookie('refresh_token', result.refresh_token, {
      httpOnly: true, // Inaccessible au JavaScript
      secure: process.env.NODE_ENV === 'production', // HTTPS en prod
      sameSite: 'strict', // Protection CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours en milliseconds
      path: '/',
    });

    // Retourner seulement l'access token et les données utilisateur
    return {
      access_token: result.access_token,
      user: result.user,
    };
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({
    summary: "Renouveler le token d'accès avec un refresh token",
  })
  @ApiResponse({
    status: 200,
    description: 'Token renouvelé avec succès',
    type: RefreshResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Refresh token invalide' })
  async refresh(
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) response: ExpressResponse,
  ): Promise<RefreshResponseDto> {
    // Récupérer le refresh token depuis les cookies
    const refreshToken = req.cookies?.refresh_token;

    if (typeof refreshToken !== 'string' || refreshToken.length === 0) {
      throw new UnauthorizedException(
        'Refresh token introuvable ou invalide dans les cookies',
      );
    }

    const result = await this.authService.refreshToken(refreshToken);

    // Définir le nouveau refresh token dans le cookie
    response.cookie('refresh_token', result.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    // Retourner seulement l'access token
    return {
      access_token: result.access_token,
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(200)
  @ApiOperation({
    summary: "Déconnecter l'utilisateur et invalider le refresh token",
  })
  @ApiResponse({
    status: 200,
    description: 'Déconnexion réussie',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Logged out successfully' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Token non autorisé' })
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
