import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ReminderController } from './reminder.controller';
import { ReminderService } from './reminder.service';
import { ReminderAutomationService } from './reminder-automation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [PrismaModule, MailModule, ScheduleModule.forRoot()],
  controllers: [ReminderController],
  providers: [ReminderService, ReminderAutomationService],
  exports: [ReminderService, ReminderAutomationService],
})
export class ReminderModule {}
