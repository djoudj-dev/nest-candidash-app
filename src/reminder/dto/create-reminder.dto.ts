import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsDateString,
  IsBoolean,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateReminderDto {
  @ApiProperty({
    description: 'JobTrack ID this reminder belongs to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString({ message: 'JobTrack ID must be a string' })
  jobTrackId: string;

  @ApiProperty({
    description: 'Frequency of reminder in days',
    example: 7,
    minimum: 1,
  })
  @IsInt({ message: 'Frequency must be an integer' })
  @Min(1, { message: 'Frequency must be at least 1 day' })
  frequency: number;

  @ApiProperty({
    description: 'Next reminder date and time',
    example: '2025-01-22T10:00:00Z',
  })
  @IsDateString(
    {},
    { message: 'Next reminder must be a valid ISO date string' },
  )
  nextReminderAt: string;

  @ApiProperty({
    description: 'Whether the reminder is active',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean;
}
