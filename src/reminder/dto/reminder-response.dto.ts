import { ApiProperty } from '@nestjs/swagger';

export class ReminderResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the reminder',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'JobTrack ID this reminder belongs to',
    example: '456e7890-e89b-12d3-a456-426614174001',
  })
  jobTrackId: string;

  @ApiProperty({
    description: 'Frequency of reminder in days',
    example: 7,
  })
  frequency: number;

  @ApiProperty({
    description: 'Next reminder date and time',
    example: '2025-01-22T10:00:00.000Z',
  })
  nextReminderAt: Date;

  @ApiProperty({
    description: 'Date when reminder was last sent',
    example: '2025-01-15T10:00:00.000Z',
    nullable: true,
  })
  lastSentAt?: Date;

  @ApiProperty({
    description: 'Whether the reminder is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Date when the reminder was created',
    example: '2025-01-15T08:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date when the reminder was last updated',
    example: '2025-01-15T14:20:00.000Z',
  })
  updatedAt: Date;
}
