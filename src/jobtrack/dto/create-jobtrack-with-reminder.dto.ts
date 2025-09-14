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
 *
 * Mutualisation : hérite de CreateJobTrackDto pour éviter la duplication
 * des champs de l'annonce, puis ajoute les champs du rappel.
 */
export class CreateJobTrackWithReminderDto extends CreateJobTrackDto {
  @ApiProperty({
    description: 'Fréquence du rappel (en jours)',
    example: 7,
    minimum: 1,
  })
  @IsInt({ message: 'La fréquence doit être un entier' })
  @Min(1, { message: 'La fréquence doit être d’au moins 1 jour' })
  frequency!: number;

  @ApiProperty({
    description: 'Prochaine date/heure du rappel (au format ISO)',
    example: '2025-01-22T10:00:00Z',
  })
  @IsDateString(
    {},
    { message: 'La prochaine date de rappel doit être une date ISO valide' },
  )
  nextReminderAt!: string;

  @ApiProperty({
    description: 'Activation du rappel',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Le champ isActive doit être un booléen' })
  isActive?: boolean;
}
