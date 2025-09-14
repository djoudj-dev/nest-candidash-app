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

export interface UserCreateData {
  email: string;
  username?: string;
  password: string;
  role?: Role;
}

export interface UserUpdateData {
  id?: string;
  email?: string;
  username?: string;
  password?: string;
  role?: Role;
}
