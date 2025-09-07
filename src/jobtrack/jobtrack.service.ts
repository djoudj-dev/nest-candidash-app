import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JobTrack as PrismaJobTrack, JobStatus } from '../../generated/prisma';
import { CreateJobTrackDto } from './dto/create-jobtrack.dto';
import { UpdateJobTrackDto } from './dto/update-jobtrack.dto';

export interface JobTrack {
  id: string;
  userId: string;
  title: string;
  company?: string;
  jobUrl?: string;
  appliedAt?: Date;
  status: JobStatus;
  notes?: string;
  attachments?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class JobTrackService {
  constructor(private prisma: PrismaService) {}

  /**
   * Map Prisma JobTrack to Service JobTrack
   */
  private mapPrismaJobTrackToJobTrack(
    prismaJobTrack: PrismaJobTrack,
  ): JobTrack {
    return {
      id: prismaJobTrack.id,
      userId: prismaJobTrack.userId,
      title: prismaJobTrack.title,
      company: prismaJobTrack.company ?? undefined,
      jobUrl: prismaJobTrack.jobUrl ?? undefined,
      appliedAt: prismaJobTrack.appliedAt ?? undefined,
      status: prismaJobTrack.status,
      notes: prismaJobTrack.notes ?? undefined,
      attachments: prismaJobTrack.attachments as
        | Record<string, any>
        | undefined,
      createdAt: prismaJobTrack.createdAt,
      updatedAt: prismaJobTrack.updatedAt,
    };
  }

  /**
   * Create a new job track for a user
   */
  async create(
    userId: string,
    createJobTrackDto: CreateJobTrackDto,
  ): Promise<JobTrack> {
    const prismaJobTrack = await this.prisma.jobTrack.create({
      data: {
        userId,
        title: createJobTrackDto.title,
        company: createJobTrackDto.company,
        jobUrl: createJobTrackDto.jobUrl,
        appliedAt: createJobTrackDto.appliedAt
          ? new Date(createJobTrackDto.appliedAt)
          : undefined,
        status: createJobTrackDto.status || 'APPLIED',
        notes: createJobTrackDto.notes,
        attachments: createJobTrackDto.attachments || undefined,
      },
    });

    return this.mapPrismaJobTrackToJobTrack(prismaJobTrack);
  }

  /**
   * Get all job tracks for a user
   */
  async findAllByUser(userId: string): Promise<JobTrack[]> {
    const prismaJobTracks = await this.prisma.jobTrack.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return prismaJobTracks.map((jobTrack) =>
      this.mapPrismaJobTrackToJobTrack(jobTrack),
    );
  }

  /**
   * Get a specific job track by ID
   */
  async findOne(id: string, userId: string): Promise<JobTrack | null> {
    const prismaJobTrack = await this.prisma.jobTrack.findUnique({
      where: { id },
    });

    if (!prismaJobTrack) {
      return null;
    }

    // Check ownership
    if (prismaJobTrack.userId !== userId) {
      throw new ForbiddenException(
        "Vous ne pouvez accéder qu'à vos propres annonces",
      );
    }

    return this.mapPrismaJobTrackToJobTrack(prismaJobTrack);
  }

  /**
   * Update a job track
   */
  async update(
    id: string,
    userId: string,
    updateJobTrackDto: UpdateJobTrackDto,
  ): Promise<JobTrack> {
    const existingJobTrack = await this.prisma.jobTrack.findUnique({
      where: { id },
    });

    if (!existingJobTrack) {
      throw new NotFoundException('JobTrack not found');
    }

    // Check ownership
    if (existingJobTrack.userId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que vos propres annonces',
      );
    }

    const updateData: Partial<{
      title: string;
      company: string;
      jobUrl: string;
      appliedAt: Date;
      status: JobStatus;
      notes: string;
      attachments: Record<string, any>;
    }> = {};

    if (updateJobTrackDto.title !== undefined) {
      updateData.title = updateJobTrackDto.title;
    }
    if (updateJobTrackDto.company !== undefined) {
      updateData.company = updateJobTrackDto.company;
    }
    if (updateJobTrackDto.jobUrl !== undefined) {
      updateData.jobUrl = updateJobTrackDto.jobUrl;
    }
    if (updateJobTrackDto.appliedAt !== undefined) {
      updateData.appliedAt = updateJobTrackDto.appliedAt
        ? new Date(updateJobTrackDto.appliedAt)
        : undefined;
    }
    if (updateJobTrackDto.status !== undefined) {
      updateData.status = updateJobTrackDto.status;
    }
    if (updateJobTrackDto.notes !== undefined) {
      updateData.notes = updateJobTrackDto.notes;
    }
    if (updateJobTrackDto.attachments !== undefined) {
      updateData.attachments = updateJobTrackDto.attachments;
    }

    const prismaJobTrack = await this.prisma.jobTrack.update({
      where: { id },
      data: updateData,
    });

    return this.mapPrismaJobTrackToJobTrack(prismaJobTrack);
  }

  /**
   * Delete a job track
   */
  async remove(id: string, userId: string): Promise<JobTrack> {
    const existingJobTrack = await this.prisma.jobTrack.findUnique({
      where: { id },
    });

    if (!existingJobTrack) {
      throw new NotFoundException('JobTrack not found');
    }

    // Check ownership
    if (existingJobTrack.userId !== userId) {
      throw new ForbiddenException(
        'Vous ne pouvez supprimer que vos propres annonces',
      );
    }

    const prismaJobTrack = await this.prisma.jobTrack.delete({
      where: { id },
    });

    return this.mapPrismaJobTrackToJobTrack(prismaJobTrack);
  }

  /**
   * Get job tracks by status for a user
   */
  async findByStatus(userId: string, status: JobStatus): Promise<JobTrack[]> {
    const prismaJobTracks = await this.prisma.jobTrack.findMany({
      where: {
        userId,
        status,
      },
      orderBy: { createdAt: 'desc' },
    });

    return prismaJobTracks.map((jobTrack) =>
      this.mapPrismaJobTrackToJobTrack(jobTrack),
    );
  }
}
