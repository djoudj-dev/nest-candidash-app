import { ApiProperty } from '@nestjs/swagger';
import { JobStatus } from '../../../generated/prisma';

export class JobTrackResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the job track',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID who owns this job track',
    example: '456e7890-e89b-12d3-a456-426614174001',
  })
  userId: string;

  @ApiProperty({
    description: 'Job title or position name',
    example: 'Senior Full Stack Developer',
  })
  title: string;

  @ApiProperty({
    description: 'Company name',
    example: 'Tech Company Inc.',
    nullable: true,
  })
  company?: string;

  @ApiProperty({
    description: 'URL to the job posting',
    example: 'https://example.com/jobs/developer',
    nullable: true,
  })
  jobUrl?: string;

  @ApiProperty({
    description: 'Date when application was submitted',
    example: '2025-01-15T10:30:00.000Z',
    nullable: true,
  })
  appliedAt?: Date;

  @ApiProperty({
    description: 'Current status of the job application',
    enum: JobStatus,
    example: JobStatus.APPLIED,
  })
  status: JobStatus;

  @ApiProperty({
    description: 'Additional notes about the job application',
    example: 'Found through LinkedIn, contacted recruiter directly',
    nullable: true,
  })
  notes?: string;

  @ApiProperty({
    description: 'Attachments metadata (CV, cover letter, etc.)',
    example: { cv: 'cv_v2.pdf', coverLetter: 'cover_letter.pdf' },
    nullable: true,
  })
  attachments?: Record<string, any>;

  @ApiProperty({
    description: 'Date when the job track was created',
    example: '2025-01-15T08:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date when the job track was last updated',
    example: '2025-01-15T14:20:00.000Z',
  })
  updatedAt: Date;
}
