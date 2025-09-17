import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const databaseUrl = process.env.DATABASE_URL;

    console.log('Environment check:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('DATABASE_URL exists:', !!databaseUrl);
    console.log('All env vars:', Object.keys(process.env));

    if (!databaseUrl) {
      console.error('DATABASE_URL environment variable is not set');
      console.error('This might be a Coolify configuration issue');
      console.error(
        'Please check that environment variables are properly set in Coolify',
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
