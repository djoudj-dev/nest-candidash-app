import { Module } from '@nestjs/common';
import { JobTrackController } from './jobtrack.controller';
import { JobTrackService } from './jobtrack.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [JobTrackController],
  providers: [JobTrackService],
  exports: [JobTrackService],
})
export class JobTrackModule {}
