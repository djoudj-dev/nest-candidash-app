import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from './email.service';
import * as crypto from 'crypto';

@Injectable()
export class VerificationService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  generateVerificationCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  async saveVerificationCode(email: string, code: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // Code expire dans 10 minutes

    await this.prisma.verificationCode.upsert({
      where: { email },
      update: {
        code,
        expiresAt,
        attempts: 0,
      },
      create: {
        email,
        code,
        expiresAt,
        attempts: 0,
      },
    });
  }

  async verifyCode(email: string, code: string): Promise<boolean> {
    const verification = await this.prisma.verificationCode.findUnique({
      where: { email },
    });

    if (!verification) {
      return false;
    }

    if (new Date() > verification.expiresAt) {
      await this.prisma.verificationCode.delete({
        where: { email },
      });
      return false;
    }

    if (verification.attempts >= 5) {
      return false;
    }

    await this.prisma.verificationCode.update({
      where: { email },
      data: {
        attempts: verification.attempts + 1,
      },
    });

    if (verification.code === code) {
      await this.prisma.verificationCode.delete({
        where: { email },
      });
      return true;
    }

    return false;
  }

  async cleanupExpiredCodes(): Promise<void> {
    await this.prisma.verificationCode.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  async sendVerificationEmail(email: string, code: string): Promise<boolean> {
    return this.emailService.sendVerificationEmail(email, code);
  }

  async canResendCode(email: string): Promise<boolean> {
    const verification = await this.prisma.verificationCode.findUnique({
      where: { email },
    });

    if (!verification) {
      return true;
    }

    const oneMinuteAgo = new Date();
    oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);

    return verification.updatedAt <= oneMinuteAgo;
  }
}
