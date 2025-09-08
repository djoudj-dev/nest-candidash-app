import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    description: "Adresse email de l'utilisateur",
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Veuillez fournir une adresse email valide' })
  @IsNotEmpty({ message: "L'email est requis" })
  email: string;
}
