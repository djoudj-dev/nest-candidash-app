import { ApiProperty } from '@nestjs/swagger';
import { ContractType, JobStatus } from '../../../generated/prisma';

/**
 * DTO de réponse combinée : Annonce (JobTrack) + Rappel (Reminder).
 */
export class JobTrackWithReminderResponseDto {
  @ApiProperty({
    description: "Identifiant unique de l'annonce",
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: "Identifiant de l'utilisateur propriétaire",
    example: '456e7890-e89b-12d3-a456-426614174001',
  })
  userId!: string;

  @ApiProperty({
    description: 'Intitulé du poste ou nom de la fonction',
    example: 'Développeur Full Stack Senior',
  })
  title!: string;

  @ApiProperty({
    description: "Nom de l'entreprise",
    example: 'Tech Company Inc.',
    nullable: true,
  })
  company?: string;

  @ApiProperty({
    description: "URL de l'offre d'emploi",
    example: 'https://exemple.com/jobs/developpeur',
    nullable: true,
  })
  jobUrl?: string;

  @ApiProperty({
    description: 'Date de soumission de la candidature',
    example: '2025-01-15T10:30:00.000Z',
    nullable: true,
  })
  appliedAt?: Date;

  @ApiProperty({
    description: 'Statut actuel de la candidature',
    enum: JobStatus,
    example: JobStatus.APPLIED,
  })
  status!: JobStatus;

  @ApiProperty({
    description: 'Type de contrat proposé',
    enum: ContractType,
    example: ContractType.CDI,
    nullable: true,
  })
  contractType?: ContractType;

  @ApiProperty({
    description: 'Notes supplémentaires concernant la candidature',
    example: 'Contacté directement par le recruteur',
    nullable: true,
  })
  notes?: string;

  @ApiProperty({
    description: 'Date de création du suivi de candidature',
    example: '2025-01-15T08:30:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: 'Date de dernière mise à jour du suivi de candidature',
    example: '2025-01-15T14:20:00.000Z',
  })
  updatedAt!: Date;

  @ApiProperty({
    description: 'Rappel initial associé à cette annonce',
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
