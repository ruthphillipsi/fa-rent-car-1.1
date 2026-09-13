import { describe, expect, it } from 'vitest';
import { cookieNames, cookieOptions, createCsrfToken, validCsrfToken } from './auth-cookies';

describe('session cookies and CSRF', () => {
  it('uses host-only secure cookies in production', () => {
    expect(cookieNames(true)).toEqual({
      access: '__Host-fa_access',
      refresh: '__Host-fa_refresh',
      csrf: '__Host-fa_csrf',
    });
    expect(cookieOptions(true)).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });
    expect(cookieOptions(true)).not.toHaveProperty('domain');
  });

  it('retains HttpOnly and SameSite for local development', () => {
    expect(cookieNames(false).access).toBe('fa_access');
    expect(cookieOptions(false)).toMatchObject({ httpOnly: true, sameSite: 'lax', secure: false });
  });

  it('generates 256-bit independent CSRF values', () => {
    const first = createCsrfToken();
    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(first).not.toBe(createCsrfToken());
    expect(validCsrfToken(first, first)).toBe(true);
  });

  it.each([undefined, null, '', 'x'.repeat(64), 'a'.repeat(63), ['a'.repeat(64)]])(
    'rejects malformed CSRF values',
    (value) => {
      expect(validCsrfToken(value, 'a'.repeat(64))).toBe(false);
      expect(validCsrfToken('a'.repeat(64), value)).toBe(false);
    },
  );

  it('rejects a valid but mismatched header', () => {
    expect(validCsrfToken('a'.repeat(64), 'b'.repeat(64))).toBe(false);
  });
});
