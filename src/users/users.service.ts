import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User as PrismaUser, Role } from '../../generated/prisma';
import * as crypto from 'crypto';

export interface CreateUserDto {
  email: string;
  username?: string;
  password: string;
  role?: Role;
}

export interface UpdateUserDto {
  id?: string;
  email?: string;
  username?: string;
  password?: string;
  role?: Role;
}

export interface User {
  id: string;
  email: string;
  username?: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  password?: string;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private mapPrismaUserToUser(prismaUser: PrismaUser): User {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      username: prismaUser.username ?? undefined,
      role: prismaUser.role,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
      password: prismaUser.password, // Available for internal use
    };
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    const hashedPassword = this.hashPassword(createUserDto.password);

    const prismaUser = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        username: createUserDto.username,
        password: hashedPassword,
        role: createUserDto.role || 'USER',
      },
    });

    return this.mapPrismaUserToUser(prismaUser);
  }

  async findAll(): Promise<User[]> {
    const prismaUsers = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return prismaUsers.map((user) => this.mapPrismaUserToUser(user));
  }

  async findOne(id: string): Promise<User | null> {
    const prismaUser = await this.prisma.user.findUnique({
      where: { id },
    });

    return prismaUser ? this.mapPrismaUserToUser(prismaUser) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const prismaUser = await this.prisma.user.findUnique({
      where: { email },
    });

    return prismaUser ? this.mapPrismaUserToUser(prismaUser) : null;
  }

  async update(updateUserDto: UpdateUserDto): Promise<User> {
    if (!updateUserDto.id) {
      throw new NotFoundException(
        "L'identifiant utilisateur est requis pour la mise à jour",
      );
    }

    const user = await this.findOne(updateUserDto.id);
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const updateData: Partial<{
      email: string;
      username: string;
      password: string;
      role: typeof updateUserDto.role;
    }> = {};

    if (updateUserDto.email) {
      updateData.email = updateUserDto.email;
    }
    if (updateUserDto.username !== undefined) {
      updateData.username = updateUserDto.username;
    }
    if (updateUserDto.password) {
      updateData.password = this.hashPassword(updateUserDto.password);
    }
    if (updateUserDto.role) {
      updateData.role = updateUserDto.role;
    }

    const prismaUser = await this.prisma.user.update({
      where: { id: updateUserDto.id },
      data: updateData,
    });

    return this.mapPrismaUserToUser(prismaUser);
  }

  async remove(id: string): Promise<User> {
    const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    const prismaUser = await this.prisma.user.delete({
      where: { id },
    });

    return this.mapPrismaUserToUser(prismaUser);
  }

  validatePassword(user: User, password: string): boolean {
    const hashedPassword = this.hashPassword(password);
    return hashedPassword === (user.password ?? '');
  }

  generatePasswordResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  async setPasswordResetToken(email: string): Promise<string | null> {
    const user = await this.findByEmail(email);
    if (!user) {
      return null;
    }

    const resetToken = this.generatePasswordResetToken();
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // Token expires in 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      },
    });

    return resetToken;
  }

  async resetPasswordWithToken(
    token: string,
    newPassword: string,
  ): Promise<boolean> {
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gte: new Date(),
        },
      },
    });

    if (!user) {
      return false;
    }

    const hashedPassword = this.hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return true;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> {
    const user = await this.findOne(userId);
    if (!user) {
      return false;
    }

    if (!this.validatePassword(user, currentPassword)) {
      return false;
    }

    const hashedPassword = this.hashPassword(newPassword);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    return true;
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string,
    expiresAt: Date,
  ): Promise<void> {
    const hashedRefreshToken = this.hashPassword(refreshToken);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshToken: hashedRefreshToken,
        refreshTokenExpires: expiresAt,
      },
    });
  }

  async validateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { refreshToken: true, refreshTokenExpires: true },
    });

    if (!user?.refreshToken || !user.refreshTokenExpires) {
      return false;
    }

    if (new Date() > user.refreshTokenExpires) {
      return false;
    }

    const hashedRefreshToken = this.hashPassword(refreshToken);
    return hashedRefreshToken === user.refreshToken;
  }

  async clearRefreshToken(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        refreshToken: null,
        refreshTokenExpires: null,
      },
    });
  }

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }
}
