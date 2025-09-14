import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: "Adresse e-mail pour l'authentification",
    example: 'utilisateur@exemple.com',
  })
  @IsEmail({}, { message: 'Veuillez fournir une adresse e-mail valide' })
  email: string;

  @ApiProperty({
    description: "Mot de passe pour l'authentification",
    example: 'MotDePasseSecurise123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, {
    message: 'Le mot de passe doit contenir au moins 6 caractères',
  })
  password: string;
}
