import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      console.error('DATABASE_URL environment variable is not set');
      console.error(
        'Available environment variables:',
        Object.keys(process.env),
      );
      throw new Error('DATABASE_URL environment variable is required');
    }

    console.log(
      'Database URL found:',
      databaseUrl.replace(/\/\/.*@/, '//***:***@'),
    );

    super({
      datasources: {
        db: {
          url: databaseUrl,
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
