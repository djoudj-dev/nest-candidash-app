import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  ValidationPipe,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JobTrackService } from './jobtrack.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateJobTrackDto } from './dto/create-jobtrack.dto';
import { UpdateJobTrackDto } from './dto/update-jobtrack.dto';
import { JobTrackResponseDto } from './dto/jobtrack-response.dto';
import { JobStatus } from '../../generated/prisma';

@ApiTags('JobTrack')
@Controller('jobtrack')
export class JobTrackController {
  constructor(private readonly jobTrackService: JobTrackService) {}

  @Post()
  @ApiOperation({
    summary: 'Créer une nouvelle annonce de suivi de candidature',
  })
  @ApiResponse({
    status: 201,
    description: 'Job track created successfully',
    type: JobTrackResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async createJobTrack(
    @Body(ValidationPipe) createJobTrackDto: CreateJobTrackDto,
    @Request() req: { user: { sub: string } },
  ) {
    const userId = req.user.sub;
    return this.jobTrackService.create(userId, createJobTrackDto);
  }

  @Get()
  @ApiOperation({
    summary: "Récupérer toutes les annonces de candidature de l'utilisateur",
  })
  @ApiResponse({
    status: 200,
    description: 'List of user job tracks',
    type: [JobTrackResponseDto],
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async getUserJobTracks(@Request() req: { user: { sub: string } }) {
    const userId = req.user.sub;
    return this.jobTrackService.findAllByUser(userId);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Récupérer les annonces par statut' })
  @ApiParam({
    name: 'status',
    description: 'Job status filter',
    enum: JobStatus,
  })
  @ApiResponse({
    status: 200,
    description: 'List of job tracks with specified status',
    type: [JobTrackResponseDto],
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async getJobTracksByStatus(
    @Param('status') status: JobStatus,
    @Request() req: { user: { sub: string } },
  ) {
    const userId = req.user.sub;
    return this.jobTrackService.findByStatus(userId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une annonce spécifique par ID' })
  @ApiParam({ name: 'id', description: 'Job track ID' })
  @ApiResponse({
    status: 200,
    description: 'Job track details',
    type: JobTrackResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Job track not found' })
  @ApiResponse({ status: 403, description: 'Access denied to this job track' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async getJobTrackById(
    @Param('id') id: string,
    @Request() req: { user: { sub: string } },
  ) {
    const userId = req.user.sub;
    const jobTrack = await this.jobTrackService.findOne(id, userId);
    if (!jobTrack) {
      throw new Error('Job track not found');
    }
    return jobTrack;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour une annonce de candidature' })
  @ApiParam({ name: 'id', description: 'Job track ID to update' })
  @ApiResponse({
    status: 200,
    description: 'Job track updated successfully',
    type: JobTrackResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Access denied to this job track' })
  @ApiResponse({ status: 404, description: 'Job track not found' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async updateJobTrack(
    @Param('id') id: string,
    @Body(ValidationPipe) updateJobTrackDto: UpdateJobTrackDto,
    @Request() req: { user: { sub: string } },
  ) {
    const userId = req.user.sub;
    updateJobTrackDto.id = id;
    return this.jobTrackService.update(id, userId, updateJobTrackDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une annonce de candidature' })
  @ApiParam({ name: 'id', description: 'Job track ID to delete' })
  @ApiResponse({
    status: 200,
    description: 'Job track deleted successfully',
    type: JobTrackResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Access denied to this job track' })
  @ApiResponse({ status: 404, description: 'Job track not found' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async deleteJobTrack(
    @Param('id') id: string,
    @Request() req: { user: { sub: string } },
  ) {
    const userId = req.user.sub;
    return this.jobTrackService.remove(id, userId);
  }
}
