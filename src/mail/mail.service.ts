import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

export interface ReminderEmailData {
  userEmail: string;
  userName: string;
  jobTitle: string;
  company: string;
  appliedAt?: Date;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure: true, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
    });
  }

  /**
   * Envoi d'un email de rappel à l'utilisateur pour relancer une candidature
   */
  async sendReminderEmail(data: ReminderEmailData): Promise<boolean> {
    try {
      const htmlContent = this.generateReminderEmailTemplate(data);
      const textContent = this.generateReminderEmailText(data);

      const mailOptions = {
        from: `${this.configService.get<string>('MAIL_FROM_NAME')} <${this.configService.get<string>('MAIL_FROM_ADDRESS')}>`,
        to: data.userEmail,
        subject: `Rappel de candidature - ${data.jobTitle} chez ${data.company}`,
        text: textContent,
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Email de rappel envoyé avec succès à ${data.userEmail} pour ${data.jobTitle}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'envoi de l'email de rappel à ${data.userEmail}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Génère le template HTML pour l'email de rappel
   */
  private generateReminderEmailTemplate(data: ReminderEmailData): string {
    const appliedDateText = data.appliedAt
      ? `postulé le ${data.appliedAt.toLocaleDateString('fr-FR')}`
      : 'postulé récemment';

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="utf-8">
        <title>Rappel de candidature</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f4f4f4; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .footer { background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; }
          .highlight { color: #2c5aa0; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 Rappel de candidature</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${data.userName || 'cher utilisateur'}</strong>,</p>
            
            <p>Il est temps de relancer votre candidature pour le poste :</p>
            
            <ul>
              <li><strong>Poste :</strong> <span class="highlight">${data.jobTitle}</span></li>
              <li><strong>Entreprise :</strong> <span class="highlight">${data.company}</span></li>
              <li><strong>Status :</strong> ${appliedDateText}</li>
            </ul>
            
            <p>Nous vous recommandons de :</p>
            <ul>
              <li>Envoyer un email de suivi poli au recruteur</li>
              <li>Vérifier le statut de votre candidature sur leur portail</li>
              <li>Mettre à jour votre dossier de candidature si nécessaire</li>
            </ul>
            
            <p>N'hésitez pas à personnaliser votre message de relance pour montrer votre intérêt continu pour le poste.</p>
            
            <p>Bonne chance avec votre candidature !</p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement par votre système de suivi des candidatures.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Génère le contenu texte pour l'email de rappel
   */
  private generateReminderEmailText(data: ReminderEmailData): string {
    const appliedDateText = data.appliedAt
      ? `postulé le ${data.appliedAt.toLocaleDateString('fr-FR')}`
      : 'postulé récemment';

    return `
Rappel de candidature

Bonjour ${data.userName || 'cher utilisateur'},

Il est temps de relancer votre candidature pour le poste :

- Poste : ${data.jobTitle}
- Entreprise : ${data.company}
- Status : ${appliedDateText}

Nous vous recommandons de :
- Envoyer un email de suivi poli au recruteur
- Vérifier le statut de votre candidature sur leur portail
- Mettre à jour votre dossier de candidature si nécessaire

N'hésitez pas à personnaliser votre message de relance pour montrer votre intérêt continu pour le poste.

Bonne chance avec votre candidature !

---
Cet email a été envoyé automatiquement par votre système de suivi des candidatures.
    `;
  }
}
