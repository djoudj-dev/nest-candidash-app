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

interface JwtRefreshPayload {
  sub: string;
  type: 'refresh';
  iat?: number;
  exp?: number;
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

  async validateUser(userId: string): Promise<User | null> {
    return this.usersService.findOne(userId);
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    // Vérifier et décoder le refresh token en isolant les erreurs JWT
    let decoded: JwtRefreshPayload;
    try {
      decoded =
        await this.jwtService.verifyAsync<JwtRefreshPayload>(refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (decoded.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    // Validate refresh token in database
    const isValid = await this.usersService.validateRefreshToken(
      decoded.sub,
      refreshToken,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Get user details
    const user = await this.usersService.findOne(decoded.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate new tokens
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = await this.jwtService.signAsync(payload);

    const refreshPayload = { sub: user.id, type: 'refresh' };
    const refresh_token = await this.jwtService.signAsync(refreshPayload, {
      expiresIn: '7d',
    });

    // Update refresh token in database
    const refreshTokenExpires = new Date();
    refreshTokenExpires.setDate(refreshTokenExpires.getDate() + 7);

    await this.usersService.updateRefreshToken(
      user.id,
      refresh_token,
      refreshTokenExpires,
    );

    const expires_in = 86400;
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

  async logout(userId: string): Promise<{ message: string }> {
    await this.usersService.clearRefreshToken(userId);
    return { message: 'Logged out successfully' };
  }
}
