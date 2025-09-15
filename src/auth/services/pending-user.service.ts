import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../../users/users.service';
import * as crypto from 'crypto';

export interface PendingUserData {
  email: string;
  password: string;
  username?: string;
}
@Injectable()
export class PendingUserService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  async createPendingUser(userData: PendingUserData): Promise<void> {
    const existingUser = await this.usersService.findByEmail(userData.email);
    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    const existingPendingUser = await this.prisma.pendingUser.findUnique({
      where: { email: userData.email },
    });

    if (existingPendingUser) {
      await this.prisma.pendingUser.update({
        where: { email: userData.email },
        data: {
          password: this.hashPassword(userData.password),
          originalPassword: userData.password,
          username: userData.username,
          verified: false,
        },
      });
    } else {
      await this.prisma.pendingUser.create({
        data: {
          email: userData.email,
          password: this.hashPassword(userData.password),
          originalPassword: userData.password,
          username: userData.username,
          verified: false,
        },
      });
    }
  }

  async validatePendingUser(email: string): Promise<{ password: string }> {
    const pendingUser = await this.prisma.pendingUser.findUnique({
      where: { email },
    });

    if (!pendingUser) {
      throw new Error('Utilisateur en attente introuvable');
    }

    await this.usersService.create({
      email: pendingUser.email,
      password: pendingUser.originalPassword,
      username: pendingUser.username || undefined,
    });

    const originalPassword = pendingUser.originalPassword;

    await this.prisma.pendingUser.delete({
      where: { email },
    });

    return { password: originalPassword };
  }

  async cleanupExpiredPendingUsers(): Promise<void> {
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    await this.prisma.pendingUser.deleteMany({
      where: {
        createdAt: {
          lt: yesterday,
        },
      },
    });
  }

  async findPendingUser(email: string): Promise<boolean> {
    const pendingUser = await this.prisma.pendingUser.findUnique({
      where: { email },
    });

    return !!pendingUser;
  }

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }
}
