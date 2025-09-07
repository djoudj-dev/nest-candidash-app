import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { Role } from '../../../generated/prisma';

export class UpdateUserDto {
  @ApiProperty({
    description: 'User ID to update',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID(4, { message: 'Please provide a valid user ID' })
  id: string;

  @ApiProperty({
    description: 'New email address',
    example: 'newemail@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @ApiProperty({
    description: 'New password',
    example: 'NewSecurePassword123',
    minLength: 6,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password?: string;

  @ApiProperty({
    description: 'New role',
    enum: Role,
    example: Role.ADMIN,
    required: false,
  })
  @IsOptional()
  @IsEnum(Role, { message: 'Role must be either USER or ADMIN' })
  role?: Role;
}
