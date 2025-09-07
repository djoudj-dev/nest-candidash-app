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
import { ReminderService } from './reminder.service';
import { ReminderAutomationService } from './reminder-automation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { ReminderResponseDto } from './dto/reminder-response.dto';

@ApiTags('Reminder')
@Controller('reminder')
export class ReminderController {
  constructor(
    private readonly reminderService: ReminderService,
    private readonly reminderAutomationService: ReminderAutomationService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Créer un nouveau rappel pour une annonce de candidature',
  })
  @ApiResponse({
    status: 201,
    description: 'Reminder created successfully',
    type: ReminderResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Access denied to job track' })
  @ApiResponse({ status: 404, description: 'Job track not found' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async createReminder(
    @Body(ValidationPipe) createReminderDto: CreateReminderDto,
    @Request() req: { user: { sub: string } },
  ) {
    const userId = req.user.sub;
    return this.reminderService.create(userId, createReminderDto);
  }

  @Get('active')
  @ApiOperation({
    summary: "Récupérer tous les rappels actifs de l'utilisateur",
  })
  @ApiResponse({
    status: 200,
    description: 'List of active user reminders',
    type: [ReminderResponseDto],
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async getUserActiveReminders(@Request() req: { user: { sub: string } }) {
    const userId = req.user.sub;
    return this.reminderService.findActiveByUser(userId);
  }

  @Get('jobtrack/:jobTrackId')
  @ApiOperation({
    summary: 'Récupérer les rappels pour une annonce spécifique',
  })
  @ApiParam({ name: 'jobTrackId', description: 'Job track ID' })
  @ApiResponse({
    status: 200,
    description: 'List of reminders for the job track',
    type: [ReminderResponseDto],
  })
  @ApiResponse({ status: 403, description: 'Access denied to job track' })
  @ApiResponse({ status: 404, description: 'Job track not found' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async getRemindersByJobTrack(
    @Param('jobTrackId') jobTrackId: string,
    @Request() req: { user: { sub: string } },
  ) {
    const userId = req.user.sub;
    return this.reminderService.findByJobTrack(jobTrackId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un rappel spécifique par ID' })
  @ApiParam({ name: 'id', description: 'Reminder ID' })
  @ApiResponse({
    status: 200,
    description: 'Reminder details',
    type: ReminderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Reminder not found' })
  @ApiResponse({ status: 403, description: 'Access denied to this reminder' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async getReminderById(
    @Param('id') id: string,
    @Request() req: { user: { sub: string } },
  ) {
    const userId = req.user.sub;
    const reminder = await this.reminderService.findOne(id, userId);
    if (!reminder) {
      throw new Error('Reminder not found');
    }
    return reminder;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un rappel' })
  @ApiParam({ name: 'id', description: 'Reminder ID to update' })
  @ApiResponse({
    status: 200,
    description: 'Reminder updated successfully',
    type: ReminderResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Access denied to this reminder' })
  @ApiResponse({ status: 404, description: 'Reminder not found' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async updateReminder(
    @Param('id') id: string,
    @Body(ValidationPipe) updateReminderDto: UpdateReminderDto,
    @Request() req: { user: { sub: string } },
  ) {
    const userId = req.user.sub;
    updateReminderDto.id = id;
    return this.reminderService.update(id, userId, updateReminderDto);
  }

  @Put(':id/mark-sent')
  @ApiOperation({
    summary: 'Marquer un rappel comme envoyé et calculer le prochain',
  })
  @ApiParam({ name: 'id', description: 'Reminder ID to mark as sent' })
  @ApiResponse({
    status: 200,
    description: 'Reminder marked as sent successfully',
    type: ReminderResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Access denied to this reminder' })
  @ApiResponse({ status: 404, description: 'Reminder not found' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async markReminderAsSent(
    @Param('id') id: string,
    @Request() req: { user: { sub: string } },
  ) {
    const userId = req.user.sub;
    return this.reminderService.markAsSent(id, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un rappel' })
  @ApiParam({ name: 'id', description: 'Reminder ID to delete' })
  @ApiResponse({
    status: 200,
    description: 'Reminder deleted successfully',
    type: ReminderResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Access denied to this reminder' })
  @ApiResponse({ status: 404, description: 'Reminder not found' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async deleteReminder(
    @Param('id') id: string,
    @Request() req: { user: { sub: string } },
  ) {
    const userId = req.user.sub;
    return this.reminderService.remove(id, userId);
  }

  @Post('automation/execute')
  @ApiOperation({
    summary: 'Exécuter manuellement la vérification des rappels automatiques',
  })
  @ApiResponse({
    status: 200,
    description: 'Manual reminder check executed successfully',
    schema: {
      type: 'object',
      properties: {
        processed: {
          type: 'number',
          description: 'Number of reminders processed',
        },
        successful: {
          type: 'number',
          description: 'Number of successful emails sent',
        },
        failed: {
          type: 'number',
          description: 'Number of failed email attempts',
        },
      },
    },
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async executeReminderCheck() {
    return this.reminderAutomationService.executeReminderCheck();
  }

  @Get('automation/statistics')
  @ApiOperation({
    summary: 'Obtenir les statistiques des rappels automatiques',
  })
  @ApiResponse({
    status: 200,
    description: 'Reminder statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalActive: {
          type: 'number',
          description: 'Total number of active reminders',
        },
        dueNow: { type: 'number', description: 'Number of reminders due now' },
        dueToday: {
          type: 'number',
          description: 'Number of reminders due today',
        },
        dueThisWeek: {
          type: 'number',
          description: 'Number of reminders due this week',
        },
      },
    },
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async getReminderStatistics() {
    return this.reminderAutomationService.getReminderStatistics();
  }
}
