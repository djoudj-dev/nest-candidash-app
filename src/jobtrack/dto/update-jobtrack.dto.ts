import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsObject,
  MinLength,
} from 'class-validator';
import { JobStatus } from '../../../generated/prisma';

export class UpdateJobTrackDto {
  @ApiProperty({
    description: 'JobTrack ID to update (automatically set from URL parameter)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  id?: string;

  @ApiProperty({
    description: 'Job title or position name',
    example: 'Senior Full Stack Developer',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  @MinLength(1, { message: 'Title cannot be empty' })
  title?: string;

  @ApiProperty({
    description: 'Company name',
    example: 'Tech Company Inc.',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Company must be a string' })
  company?: string;

  @ApiProperty({
    description: 'URL to the job posting',
    example: 'https://example.com/jobs/developer',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Job URL must be a string' })
  jobUrl?: string;

  @ApiProperty({
    description: 'Date when application was submitted',
    example: '2025-01-15T10:30:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Applied date must be a valid ISO date string' })
  appliedAt?: string;

  @ApiProperty({
    description: 'Current status of the job application',
    enum: JobStatus,
    example: JobStatus.PENDING,
    required: false,
  })
  @IsOptional()
  @IsEnum(JobStatus, { message: 'Status must be a valid job status' })
  status?: JobStatus;

  @ApiProperty({
    description: 'Additional notes about the job application',
    example: 'Updated with interview feedback',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  notes?: string;

  @ApiProperty({
    description: 'Attachments metadata (CV, cover letter, etc.)',
    example: { cv: 'cv_v3.pdf', coverLetter: 'cover_letter_updated.pdf' },
    required: false,
  })
  @IsOptional()
  @IsObject({ message: 'Attachments must be an object' })
  attachments?: Record<string, any>;
}
