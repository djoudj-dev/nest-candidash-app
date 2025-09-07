import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService, User } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: Omit<User, 'password'>;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = this.usersService.validatePassword(
      user,
      loginDto.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = await this.jwtService.signAsync(payload);

    // Generate refresh token with longer expiration
    const refreshPayload = { sub: user.id, type: 'refresh' };
    const refresh_token = await this.jwtService.signAsync(refreshPayload, {
      expiresIn: '7d',
    });

    // Calculate refresh token expiration date (7 days)
    const refreshTokenExpires = new Date();
    refreshTokenExpires.setDate(refreshTokenExpires.getDate() + 7);

    // Save refresh token in database
    await this.usersService.updateRefreshToken(
      user.id,
      refresh_token,
      refreshTokenExpires,
    );

    // Token expires in 24 hours (24 * 60 * 60 = 86400 seconds)
    const expires_in = 86400;

    // Remove password from user object
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    return {
      access_token,
      refresh_token,
      expires_in,
      token_type: 'Bearer',
      user: userWithoutPassword,
    };
  }

  async validateUser(userId: string) {
    return this.usersService.findOne(userId);
  }
}
