import { JobTrack as PrismaJobTrack } from '../../../generated/prisma';
import { JobTrack } from '../interfaces';

export class JobTrackMapper {
  /**
   * Map Prisma JobTrack to Service JobTrack
   */
  static mapPrismaJobTrackToJobTrack(prismaJobTrack: PrismaJobTrack): JobTrack {
    return {
      id: prismaJobTrack.id,
      userId: prismaJobTrack.userId,
      title: prismaJobTrack.title,
      company: prismaJobTrack.company ?? undefined,
      jobUrl: prismaJobTrack.jobUrl ?? undefined,
      appliedAt: prismaJobTrack.appliedAt ?? undefined,
      status: prismaJobTrack.status,
      contractType: prismaJobTrack.contractType ?? undefined,
      notes: prismaJobTrack.notes ?? undefined,
      createdAt: prismaJobTrack.createdAt,
      updatedAt: prismaJobTrack.updatedAt,
    };
  }
}
