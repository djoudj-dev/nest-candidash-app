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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from '../auth/dto/auth-response.dto';
import { UploadCvResponseDto } from './dto/upload-cv.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { getMulterConfig } from '../config/multer.config';
import { MailService } from '../mail/mail.service';

@ApiTags('Users')
@Controller('accounts')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  @Get('directory')
  @ApiOperation({ summary: 'Récupérer tous les comptes utilisateur' })
  @ApiResponse({
    status: 200,
    description: 'List of all user accounts',
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
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'User profile information',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async getUserById(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    if (!user) {
      throw new Error('User not found');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userResponse } = user;
    return userResponse;
  }

  @Post('registration')
  @ApiOperation({ summary: 'Enregistrer un nouveau compte utilisateur' })
  @ApiResponse({
    status: 201,
    description: 'User account created successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async createUser(@Body(ValidationPipe) createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);

    // Envoi de l'email de confirmation d'inscription
    try {
      await this.mailService.sendRegistrationConfirmationEmail({
        userEmail: user.email,
        userName: user.username,
        registrationDate: user.createdAt,
      });
    } catch (error) {
      // Log l'erreur mais ne fait pas échouer la création du compte
      console.error(
        "Erreur lors de l'envoi de l'email de confirmation:",
        error,
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userResponse } = user;
    return userResponse;
  }

  @Put('profile-update/:id')
  @ApiOperation({ summary: 'Mettre à jour le profil utilisateur' })
  @ApiParam({ name: 'id', description: 'User ID to update' })
  @ApiResponse({
    status: 200,
    description: 'User profile updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - can only update own profile',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async updateUser(
    @Param('id') userId: string,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
    @Request() req: { user: { sub: string } },
  ) {
    const currentUserId = req.user.sub;

    // Allow user to update their own profile regardless of role
    if (currentUserId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que votre propre profil',
      );
    }

    // Set the user ID from the URL parameter
    updateUserDto.id = userId;
    const user = await this.usersService.update(updateUserDto);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userResponse } = user;
    return userResponse;
  }

  @Delete('deactivation/:id')
  @ApiOperation({ summary: 'Désactiver le compte utilisateur' })
  @ApiParam({ name: 'id', description: 'User ID to deactivate' })
  @ApiResponse({
    status: 200,
    description: 'User account deactivated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - can only delete own profile',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async deleteUser(
    @Param('id') id: string,
    @Request() req: { user: { sub: string } },
  ) {
    const currentUserId = req.user.sub;

    // Allow user to delete their own profile regardless of role
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

  @Post('upload-cv/:id')
  @ApiOperation({ summary: 'Upload CV for user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'CV uploaded successfully',
    type: UploadCvResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file format' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - can only upload own CV',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', getMulterConfig()))
  async uploadCv(
    @Param('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: { user: { sub: string } },
  ): Promise<UploadCvResponseDto> {
    const currentUserId = req.user.sub;

    // Allow user to upload CV only to their own profile
    if (currentUserId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez télécharger un CV que pour votre propre profil',
      );
    }

    if (!file) {
      throw new Error('Aucun fichier fourni');
    }

    const filePath = `/uploads/docs/${file.filename}`;
    await this.usersService.uploadCv(userId, filePath);

    return {
      cvPath: filePath,
      originalName: file.originalname,
      size: file.size,
      uploadedAt: new Date(),
    };
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Demander une réinitialisation de mot de passe' })
  @ApiResponse({
    status: 200,
    description: 'Email de réinitialisation envoyé si le compte existe',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
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

    // Toujours retourner success pour éviter l'énumération des emails
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
