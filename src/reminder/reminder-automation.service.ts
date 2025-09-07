import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { MailService, ReminderEmailData } from '../mail/mail.service';

@Injectable()
export class ReminderAutomationService {
  private readonly logger = new Logger(ReminderAutomationService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  /**
   * Tâche CRON qui s'exécute toutes les heures pour vérifier les rappels à envoyer
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkAndSendReminders(): Promise<void> {
    this.logger.log('Début de la vérification des rappels automatiques');

    try {
      const dueReminders = await this.findDueReminders();
      this.logger.log(`${dueReminders.length} rappel(s) à envoyer trouvé(s)`);

      if (dueReminders.length === 0) {
        return;
      }

      for (const reminder of dueReminders) {
        await this.processReminder(reminder);
      }

      this.logger.log('Vérification des rappels terminée avec succès');
    } catch (error) {
      this.logger.error('Erreur lors de la vérification des rappels:', error);
    }
  }

  /**
   * Méthode publique pour exécuter manuellement la vérification des rappels
   */
  async executeReminderCheck(): Promise<{
    processed: number;
    successful: number;
    failed: number;
  }> {
    this.logger.log('Exécution manuelle de la vérification des rappels');

    let processed = 0;
    let successful = 0;
    let failed = 0;

    try {
      const dueReminders = await this.findDueReminders();
      processed = dueReminders.length;

      this.logger.log(`${processed} rappel(s) à traiter`);

      for (const reminder of dueReminders) {
        const result = await this.processReminder(reminder);
        if (result) {
          successful++;
        } else {
          failed++;
        }
      }

      this.logger.log(
        `Traitement terminé: ${successful} succès, ${failed} échecs sur ${processed} rappels`,
      );
    } catch (error) {
      this.logger.error("Erreur lors de l'exécution manuelle:", error);
      failed = processed - successful;
    }

    return { processed, successful, failed };
  }

  /**
   * Trouve tous les rappels qui doivent être envoyés
   */
  private async findDueReminders(): Promise<ReminderWithJobTrackAndUser[]> {
    const now = new Date();

    return await this.prisma.reminder.findMany({
      where: {
        isActive: true,
        nextReminderAt: {
          lte: now,
        },
      },
      include: {
        jobtrack: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        nextReminderAt: 'asc',
      },
    });
  }

  /**
   * Traite un rappel individuel: envoie l'email et met à jour la base de données
   */
  private async processReminder(
    reminder: ReminderWithJobTrackAndUser,
  ): Promise<boolean> {
    try {
      this.logger.log(
        `Traitement du rappel ${reminder.id} pour l'utilisateur ${reminder.jobtrack.user.email}`,
      );

      // Préparer les données pour l'email
      const emailData: ReminderEmailData = {
        userEmail: reminder.jobtrack.user.email,
        userName: reminder.jobtrack.user.username || '',
        jobTitle: reminder.jobtrack.title,
        company: reminder.jobtrack.company || 'Entreprise non spécifiée',
        appliedAt: reminder.jobtrack.appliedAt || undefined,
      };

      // Envoyer l'email
      const emailSent = await this.mailService.sendReminderEmail(emailData);

      if (emailSent) {
        // Mettre à jour le rappel en base de données
        await this.updateReminderAfterSending(reminder.id, reminder.frequency);
        this.logger.log(`Rappel ${reminder.id} traité avec succès`);
        return true;
      } else {
        this.logger.error(
          `Échec de l'envoi de l'email pour le rappel ${reminder.id}`,
        );
        return false;
      }
    } catch (error) {
      this.logger.error(
        `Erreur lors du traitement du rappel ${reminder.id}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Met à jour un rappel après l'envoi d'un email
   */
  private async updateReminderAfterSending(
    reminderId: string,
    frequency: number,
  ): Promise<void> {
    const now = new Date();
    const nextReminderAt = new Date(now);
    nextReminderAt.setDate(now.getDate() + frequency);

    await this.prisma.reminder.update({
      where: { id: reminderId },
      data: {
        lastSentAt: now,
        nextReminderAt,
      },
    });

    this.logger.log(
      `Rappel ${reminderId} mis à jour. Prochain envoi: ${nextReminderAt.toISOString()}`,
    );
  }

  /**
   * Méthode utilitaire pour obtenir des statistiques sur les rappels
   */
  async getReminderStatistics(): Promise<{
    totalActive: number;
    dueNow: number;
    dueToday: number;
    dueThisWeek: number;
  }> {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + 7);

    const [totalActive, dueNow, dueToday, dueThisWeek] = await Promise.all([
      this.prisma.reminder.count({
        where: { isActive: true },
      }),
      this.prisma.reminder.count({
        where: {
          isActive: true,
          nextReminderAt: { lte: now },
        },
      }),
      this.prisma.reminder.count({
        where: {
          isActive: true,
          nextReminderAt: { lte: endOfDay },
        },
      }),
      this.prisma.reminder.count({
        where: {
          isActive: true,
          nextReminderAt: { lte: endOfWeek },
        },
      }),
    ]);

    return {
      totalActive,
      dueNow,
      dueToday,
      dueThisWeek,
    };
  }
}

// Type helper pour les données de rappel avec les relations incluses
type ReminderWithJobTrackAndUser = {
  id: string;
  jobTrackId: string;
  frequency: number;
  nextReminderAt: Date;
  lastSentAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  jobtrack: {
    id: string;
    userId: string;
    title: string;
    company: string | null;
    jobUrl: string | null;
    appliedAt: Date | null;
    status: string;
    notes: string | null;
    attachments: any;
    createdAt: Date;
    updatedAt: Date;
    user: {
      id: string;
      email: string;
      username: string | null;
    };
  };
};
