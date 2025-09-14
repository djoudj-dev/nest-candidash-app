export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

export interface PasswordResetData {
  token: string;
  newPassword: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface PasswordResetTokenData {
  email: string;
  token: string;
  expiresAt: Date;
}
