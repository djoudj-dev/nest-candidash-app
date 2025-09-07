import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Reminder as PrismaReminder } from '../../generated/prisma';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';

export interface Reminder {
  id: string;
  jobTrackId: string;
  frequency: number;
  nextReminderAt: Date;
  lastSentAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ReminderService {
  constructor(private prisma: PrismaService) {}

  /**
   * Map Prisma Reminder to Service Reminder
   */
  private mapPrismaReminderToReminder(
    prismaReminder: PrismaReminder,
  ): Reminder {
    return {
      id: prismaReminder.id,
      jobTrackId: prismaReminder.jobTrackId,
      frequency: prismaReminder.frequency,
      nextReminderAt: prismaReminder.nextReminderAt,
      lastSentAt: prismaReminder.lastSentAt ?? undefined,
      isActive: prismaReminder.isActive,
      createdAt: prismaReminder.createdAt,
      updatedAt: prismaReminder.updatedAt,
    };
  }

  /**
   * Validate that user owns the jobTrack
   */
  private async validateJobTrackOwnership(
    jobTrackId: string,
    userId: string,
  ): Promise<void> {
    const jobTrack = await this.prisma.jobTrack.findUnique({
      where: { id: jobTrackId },
    });

    if (!jobTrack) {
      throw new NotFoundException('JobTrack not found');
    }

    if (jobTrack.userId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez créer des rappels que pour vos propres annonces',
      );
    }
  }

  /**
   * Create a new reminder
   */
  async create(
    userId: string,
    createReminderDto: CreateReminderDto,
  ): Promise<Reminder> {
    // Validate jobTrack ownership
    await this.validateJobTrackOwnership(createReminderDto.jobTrackId, userId);

    const prismaReminder = await this.prisma.reminder.create({
      data: {
        jobTrackId: createReminderDto.jobTrackId,
        frequency: createReminderDto.frequency,
        nextReminderAt: new Date(createReminderDto.nextReminderAt),
        isActive: createReminderDto.isActive ?? true,
      },
    });

    return this.mapPrismaReminderToReminder(prismaReminder);
  }

  /**
   * Get all reminders for a specific jobTrack
   */
  async findByJobTrack(
    jobTrackId: string,
    userId: string,
  ): Promise<Reminder[]> {
    // Validate jobTrack ownership
    await this.validateJobTrackOwnership(jobTrackId, userId);

    const prismaReminders = await this.prisma.reminder.findMany({
      where: { jobTrackId },
      orderBy: { nextReminderAt: 'asc' },
    });

    return prismaReminders.map((reminder) =>
      this.mapPrismaReminderToReminder(reminder),
    );
  }

  /**
   * Get all active reminders for user's job tracks
   */
  async findActiveByUser(userId: string): Promise<Reminder[]> {
    const prismaReminders = await this.prisma.reminder.findMany({
      where: {
        isActive: true,
        jobtrack: {
          userId,
        },
      },
      orderBy: { nextReminderAt: 'asc' },
    });

    return prismaReminders.map((reminder) =>
      this.mapPrismaReminderToReminder(reminder),
    );
  }

  /**
   * Get a specific reminder by ID
   */
  async findOne(id: string, userId: string): Promise<Reminder | null> {
    const prismaReminder = await this.prisma.reminder.findUnique({
      where: { id },
      include: {
        jobtrack: true,
      },
    });

    if (!prismaReminder) {
      return null;
    }

    // Check ownership through jobTrack
    if (prismaReminder.jobtrack.userId !== userId) {
      throw new ForbiddenException(
        "Vous ne pouvez accéder qu'à vos propres rappels",
      );
    }

    return this.mapPrismaReminderToReminder(prismaReminder);
  }

  /**
   * Update a reminder
   */
  async update(
    id: string,
    userId: string,
    updateReminderDto: UpdateReminderDto,
  ): Promise<Reminder> {
    const existingReminder = await this.prisma.reminder.findUnique({
      where: { id },
      include: {
        jobtrack: true,
      },
    });

    if (!existingReminder) {
      throw new NotFoundException('Reminder not found');
    }

    // Check ownership through jobTrack
    if (existingReminder.jobtrack.userId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que vos propres rappels',
      );
    }

    const updateData: Partial<{
      frequency: number;
      nextReminderAt: Date;
      isActive: boolean;
    }> = {};

    if (updateReminderDto.frequency !== undefined) {
      updateData.frequency = updateReminderDto.frequency;
    }
    if (updateReminderDto.nextReminderAt !== undefined) {
      updateData.nextReminderAt = new Date(updateReminderDto.nextReminderAt);
    }
    if (updateReminderDto.isActive !== undefined) {
      updateData.isActive = updateReminderDto.isActive;
    }

    const prismaReminder = await this.prisma.reminder.update({
      where: { id },
      data: updateData,
    });

    return this.mapPrismaReminderToReminder(prismaReminder);
  }

  /**
   * Delete a reminder
   */
  async remove(id: string, userId: string): Promise<Reminder> {
    const existingReminder = await this.prisma.reminder.findUnique({
      where: { id },
      include: {
        jobtrack: true,
      },
    });

    if (!existingReminder) {
      throw new NotFoundException('Reminder not found');
    }

    // Check ownership through jobTrack
    if (existingReminder.jobtrack.userId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que vos propres rappels',
      );
    }

    const prismaReminder = await this.prisma.reminder.delete({
      where: { id },
    });

    return this.mapPrismaReminderToReminder(prismaReminder);
  }

  /**
   * Mark reminder as sent and calculate next reminder time
   */
  async markAsSent(id: string, userId: string): Promise<Reminder> {
    const existingReminder = await this.prisma.reminder.findUnique({
      where: { id },
      include: {
        jobtrack: true,
      },
    });

    if (!existingReminder) {
      throw new NotFoundException('Reminder not found');
    }

    // Check ownership through jobTrack
    if (existingReminder.jobtrack.userId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que vos propres rappels',
      );
    }

    const now = new Date();
    const nextReminderAt = new Date(now);
    nextReminderAt.setDate(now.getDate() + existingReminder.frequency);

    const prismaReminder = await this.prisma.reminder.update({
      where: { id },
      data: {
        lastSentAt: now,
        nextReminderAt,
      },
    });

    return this.mapPrismaReminderToReminder(prismaReminder);
  }
}
