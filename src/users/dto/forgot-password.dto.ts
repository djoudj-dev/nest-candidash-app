import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    description: "Adresse e-mail de l'utilisateur",
    example: 'utilisateur@exemple.com',
  })
  @IsEmail({}, { message: 'Veuillez fournir une adresse e-mail valide' })
  @IsNotEmpty({ message: "L'e-mail est requis" })
  email: string;
}
