import type { Request as ExpressRequest } from 'express';

export interface AuthenticatedUserRequest extends ExpressRequest {
  user: {
    sub: string;
    email?: string;
    role?: string;
  };
}
