import type { AdminUser } from '@fa/shared';

export interface AuthenticatedAdmin {
  user: AdminUser;
  sessionId: string;
  expiresAt: string;
}

export interface SessionCredentials {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
  response: { user: AdminUser; expiresAt: string };
}
