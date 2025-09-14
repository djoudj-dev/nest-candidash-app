import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description:
      "Jeton de renouvellement pour obtenir un nouveau jeton d'accès",
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString({
    message: 'Le jeton de renouvellement doit être une chaîne de caractères',
  })
  @IsNotEmpty({ message: 'Le jeton de renouvellement ne peut pas être vide' })
  refresh_token: string;
}
