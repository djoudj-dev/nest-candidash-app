import {
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  ValidationPipe,
  Request,
  ForbiddenException,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import type { Response as ExpressResponse } from 'express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  AuthResponseDto,
  UserResponseDto,
} from '../auth/dto/auth-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { MailService } from '../mail/mail.service';
import { AuthService } from '../auth/auth.service';

@ApiTags('Users')
@Controller('accounts')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly authService: AuthService,
  ) {}

  @Get('directory')
  @ApiOperation({ summary: 'Récupérer tous les comptes utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Liste de tous les comptes utilisateurs',
    type: [UserResponseDto],
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async getUsers() {
    const users = await this.usersService.findAll();
    return users.map((user) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...userResponse } = user;
      return userResponse;
    });
  }

  @Get('profile/:id')
  @ApiOperation({ summary: 'Récupérer le profil utilisateur par ID' })
  @ApiParam({ name: 'id', description: 'Identifiant utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'Informations du profil utilisateur',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async getUserById(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new Error('Utilisateur introuvable');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userResponse } = user;
    return userResponse;
  }

  @Post('registration')
  @ApiOperation({
    summary:
      'Enregistrer un nouveau compte utilisateur et le connecter automatiquement',
  })
  @ApiResponse({
    status: 201,
    description: 'Compte utilisateur créé et connecté avec succès',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: "Données d'entrée invalides" })
  @ApiResponse({ status: 409, description: "L'utilisateur existe déjà" })
  async createUser(
    @Body(ValidationPipe) createUserDto: CreateUserDto,
    @Res({ passthrough: true }) response: ExpressResponse,
  ): Promise<AuthResponseDto> {
    // Créer l'utilisateur
    const user = await this.usersService.create(createUserDto);

    // Envoyer l'email de confirmation
    try {
      await this.mailService.sendRegistrationConfirmationEmail({
        userEmail: user.email,
        userName: user.username,
        registrationDate: user.createdAt,
      });
    } catch (error) {
      console.error(
        "Erreur lors de l'envoi de l'email de confirmation:",
        error,
      );
    }

    // Connecter automatiquement l'utilisateur
    const loginResult = await this.authService.login({
      email: user.email,
      password: createUserDto.password,
    });

    // Définir le refresh token dans un cookie HttpOnly
    response.cookie('refresh_token', loginResult.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      path: '/',
    });

    // Retourner l'access token et les données utilisateur
    return {
      access_token: loginResult.access_token,
      user: loginResult.user,
    };
  }

  @Put('profile-update/:id')
  @ApiOperation({ summary: 'Mettre à jour le profil utilisateur' })
  @ApiParam({
    name: 'id',
    description: 'Identifiant utilisateur à mettre à jour',
  })
  @ApiResponse({
    status: 200,
    description: 'Profil utilisateur mis à jour avec succès',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Données d’entrée invalides' })
  @ApiResponse({
    status: 403,
    description:
      'Interdit - vous ne pouvez mettre à jour que votre propre profil',
  })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async updateUser(
    @Param('id') userId: string,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
    @Request() req: { user: { sub: string } },
  ) {
    const currentUserId = req.user.sub;

    if (currentUserId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que votre propre profil',
      );
    }

    updateUserDto.id = userId;
    const user = await this.usersService.update(updateUserDto);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userResponse } = user;
    return userResponse;
  }

  @Delete('deactivation/:id')
  @ApiOperation({ summary: 'Désactiver le compte utilisateur' })
  @ApiParam({ name: 'id', description: 'Identifiant utilisateur à désactiver' })
  @ApiResponse({
    status: 200,
    description: 'Compte utilisateur désactivé avec succès',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Interdit - vous ne pouvez supprimer que votre propre profil',
  })
  @ApiResponse({ status: 404, description: 'Utilisateur introuvable' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async deleteUser(
    @Param('id') id: string,
    @Request() req: { user: { sub: string } },
  ) {
    const currentUserId = req.user.sub;

    if (currentUserId !== id) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que votre propre profil',
      );
    }

    const user = await this.usersService.remove(id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userResponse } = user;
    return userResponse;
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Demander une réinitialisation de mot de passe' })
  @ApiResponse({
    status: 200,
    description: 'Email de réinitialisation envoyé si le compte existe',
  })
  @ApiResponse({ status: 400, description: 'Données d’entrée invalides' })
  async forgotPassword(
    @Body(ValidationPipe) forgotPasswordDto: ForgotPasswordDto,
  ) {
    const resetToken = await this.usersService.setPasswordResetToken(
      forgotPasswordDto.email,
    );

    if (resetToken) {
      const user = await this.usersService.findByEmail(forgotPasswordDto.email);
      if (user) {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

        try {
          await this.mailService.sendPasswordResetEmail({
            userEmail: user.email,
            userName: user.username,
            resetToken,
            resetUrl,
          });
        } catch (error) {
          console.error(
            "Erreur lors de l'envoi de l'email de réinitialisation:",
            error,
          );
        }
      }
    }

    return {
      message:
        'Si votre email existe, vous recevrez les instructions de réinitialisation',
    };
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Réinitialiser le mot de passe avec un token' })
  @ApiResponse({
    status: 200,
    description: 'Mot de passe réinitialisé avec succès',
  })
  @ApiResponse({ status: 400, description: 'Token invalide ou expiré' })
  async resetPassword(
    @Body(ValidationPipe) resetPasswordDto: ResetPasswordDto,
  ) {
    const success = await this.usersService.resetPasswordWithToken(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );

    if (!success) {
      throw new Error('Token invalide ou expiré');
    }

    return { message: 'Mot de passe réinitialisé avec succès' };
  }

  @Put('change-password')
  @ApiOperation({ summary: 'Changer le mot de passe (utilisateur connecté)' })
  @ApiResponse({
    status: 200,
    description: 'Mot de passe modifié avec succès',
  })
  @ApiResponse({ status: 400, description: 'Mot de passe actuel incorrect' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Body(ValidationPipe) changePasswordDto: ChangePasswordDto,
    @Request() req: { user: { sub: string } },
  ) {
    const userId = req.user.sub;

    const success = await this.usersService.changePassword(
      userId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );

    if (!success) {
      throw new Error('Mot de passe actuel incorrect');
    }

    return { message: 'Mot de passe modifié avec succès' };
  }
}
