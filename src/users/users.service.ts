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
  password: string;
  role?: Role;
}

export interface UpdateUserDto {
  id: string;
  email?: string;
  password?: string;
  role?: Role;
}

export interface User {
  id: string;
  email: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  password?: string;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Map Prisma User to Service User (exclude sensitive fields when needed)
   */
  private mapPrismaUserToUser(prismaUser: PrismaUser): User {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
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
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = this.hashPassword(createUserDto.password);

    const prismaUser = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
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
    const user = await this.findOne(updateUserDto.id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateData: Partial<{
      email: string;
      password: string;
      role: typeof updateUserDto.role;
    }> = {};

    if (updateUserDto.email) {
      updateData.email = updateUserDto.email;
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
      throw new NotFoundException('User not found');
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

  /**
   * Update refresh token for a user
   */
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

  /**
   * Validate refresh token for a user
   */
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

  /**
   * Clear refresh token for a user (logout)
   */
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
