import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { VerificationService } from './services/verification.service';
import { PendingUserService } from './services/pending-user.service';
import { EmailService } from './services/email.service';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    forwardRef(() => UsersModule),
    PrismaModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthGuard,
    VerificationService,
    PendingUserService,
    EmailService,
  ],
  exports: [
    AuthService,
    JwtAuthGuard,
    VerificationService,
    PendingUserService,
    EmailService,
  ],
})
export class AuthModule {}
