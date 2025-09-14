import type { Request as ExpressRequest } from 'express';

export interface AuthenticatedUser {
  user: {
    sub: string;
    email?: string;
    role?: string;
  };
}

export interface RequestWithCookies extends ExpressRequest {
  cookies: Record<string, string | undefined>;
}

export interface AuthenticatedRequest extends ExpressRequest {
  user: {
    sub: string;
    email?: string;
    role?: string;
  };
}
