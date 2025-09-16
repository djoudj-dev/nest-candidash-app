import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    try {
      console.log('Attempting to connect to database...');
      await this.$connect();
      console.log('Database connected successfully!');
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  }
}
