import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';
import { CreateJobTrackDto } from './create-jobtrack.dto';

/**
 * DTO de création combinée d'une annonce (JobTrack) avec rappel initial (Reminder).
 * Le code est en anglais, la documentation en français.
 *
 * Mutualisation: hérite de CreateJobTrackDto pour éviter la duplication
 * des champs de l'annonce, puis ajoute les champs du rappel.
 */
export class CreateJobTrackWithReminderDto extends CreateJobTrackDto {
  @ApiProperty({
    description: 'Fréquence du rappel (jours)',
    example: 7,
    minimum: 1,
  })
  @IsInt({ message: 'Frequency must be an integer' })
  @Min(1, { message: 'Frequency must be at least 1 day' })
  frequency!: number;

  @ApiProperty({
    description: 'Prochaine date/heure de rappel (ISO string)',
    example: '2025-01-22T10:00:00Z',
  })
  @IsDateString(
    {},
    { message: 'Next reminder must be a valid ISO date string' },
  )
  nextReminderAt!: string;

  @ApiProperty({
    description: 'Activation du rappel',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean;
}
