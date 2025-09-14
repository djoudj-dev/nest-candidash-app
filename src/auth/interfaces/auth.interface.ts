import { Role } from '../../../generated/prisma';

export interface User {
  id: string;
  email: string;
  username?: string;
  password: string;
  role: Role;
  refreshToken?: string;
  refreshTokenExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSafe {
  id: string;
  email: string;
  username?: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface AuthResult {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: UserSafe;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface JwtRefreshPayload {
  sub: string;
  type: 'refresh';
  iat?: number;
  exp?: number;
}
