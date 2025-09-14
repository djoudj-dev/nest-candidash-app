import { ApiProperty } from '@nestjs/swagger';
import { ContractType, JobStatus } from '../../../generated/prisma';

/**
 * DTO de réponse combinée Annonce + Rappel créé.
 */
export class JobTrackWithReminderResponseDto {
  @ApiProperty({
    description: "ID de l'annonce",
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: "ID de l'utilisateur propriétaire",
    example: '456e7890-e89b-12d3-a456-426614174001',
  })
  userId!: string;

  @ApiProperty({
    description: "Titre de l'annonce",
    example: 'Senior Full Stack Developer',
  })
  title!: string;

  @ApiProperty({
    description: 'Entreprise',
    example: 'Tech Company Inc.',
    nullable: true,
  })
  company?: string;

  @ApiProperty({
    description: "URL de l'annonce",
    example: 'https://example.com/jobs/developer',
    nullable: true,
  })
  jobUrl?: string;

  @ApiProperty({
    description: 'Date de candidature',
    example: '2025-01-15T10:30:00.000Z',
    nullable: true,
  })
  appliedAt?: Date;

  @ApiProperty({
    description: 'Statut',
    enum: JobStatus,
    example: JobStatus.APPLIED,
  })
  status!: JobStatus;

  @ApiProperty({
    description: 'Type de contrat',
    enum: ContractType,
    example: ContractType.CDI,
    nullable: true,
  })
  contractType?: ContractType;

  @ApiProperty({
    description: 'Notes',
    example: 'Contacté par le recruteur',
    nullable: true,
  })
  notes?: string;

  @ApiProperty({ description: 'Créé le', example: '2025-01-15T08:30:00.000Z' })
  createdAt!: Date;

  @ApiProperty({
    description: 'Mis à jour le',
    example: '2025-01-15T14:20:00.000Z',
  })
  updatedAt!: Date;

  @ApiProperty({
    description: 'Rappel initial créé pour cette annonce',
    example: {
      id: '789e0123-e89b-12d3-a456-426614174002',
      jobTrackId: '123e4567-e89b-12d3-a456-426614174000',
      frequency: 7,
      nextReminderAt: '2025-01-22T10:00:00.000Z',
      lastSentAt: null,
      isActive: true,
      createdAt: '2025-01-15T08:30:00.000Z',
      updatedAt: '2025-01-15T08:30:00.000Z',
    },
  })
  reminder!: {
    id: string;
    jobTrackId: string;
    frequency: number;
    nextReminderAt: Date;
    lastSentAt?: Date | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}
