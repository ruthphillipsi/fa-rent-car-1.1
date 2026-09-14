import { randomBytes, timingSafeEqual } from 'node:crypto';
import { ACCESS_TOKEN_TTL_SECONDS } from '@fa/shared';
import type { CookieOptions, Request, Response } from 'express';

export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const ACCESS_TTL_SECONDS = ACCESS_TOKEN_TTL_SECONDS;

export function cookieNames(production: boolean) {
  const prefix = production ? '__Host-fa_' : 'fa_';
  return { access: `${prefix}access`, refresh: `${prefix}refresh`, csrf: `${prefix}csrf` };
}

export function readCookie(request: Request, name: string): string | undefined {
  const cookies: unknown = request.cookies;
  if (!cookies || typeof cookies !== 'object') return undefined;
  const value: unknown = Reflect.get(cookies, name);
  return typeof value === 'string' ? value : undefined;
}

export function cookieOptions(production: boolean): CookieOptions {
  return { httpOnly: true, secure: production, sameSite: 'lax', path: '/' };
}

export function setSessionCookies(
  response: Response,
  production: boolean,
  session: {
    accessToken: string;
    refreshToken: string;
    refreshExpiresAt: Date;
  },
) {
  const names = cookieNames(production);
  response.cookie(names.access, session.accessToken, {
    ...cookieOptions(production),
    maxAge: ACCESS_TTL_SECONDS * 1000,
  });
  response.cookie(names.refresh, session.refreshToken, {
    ...cookieOptions(production),
    expires: session.refreshExpiresAt,
  });
}

export function clearSessionCookies(response: Response, production: boolean) {
  const names = cookieNames(production);
  response.clearCookie(names.access, cookieOptions(production));
  response.clearCookie(names.refresh, cookieOptions(production));
}

export function createCsrfToken() {
  return randomBytes(32).toString('hex');
}

export function validCsrfToken(header: unknown, cookie: unknown) {
  return (
    typeof header === 'string' &&
    typeof cookie === 'string' &&
    /^[a-f0-9]{64}$/.test(header) &&
    /^[a-f0-9]{64}$/.test(cookie) &&
    timingSafeEqual(Buffer.from(header, 'hex'), Buffer.from(cookie, 'hex'))
  );
}
