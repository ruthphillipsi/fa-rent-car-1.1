import { describe, expect, it } from 'vitest';
import { adminUserSchema, loginRequestSchema } from '@fa/shared';

import {
  BCRYPT_COST,
  MAX_ADMIN_EMAIL_LENGTH,
  MAX_BCRYPT_PASSWORD_BYTES,
  readSeedConfig,
  SeedConfigError,
} from '../src/seed-config';

const validEnvironment = {
  SEED_ADMIN_EMAIL: 'OWNER@EXAMPLE.TEST',
  SEED_ADMIN_PASSWORD: 'A-unique-seed-password-2026!',
};

describe('readSeedConfig', () => {
  it('normalizes the admin email and defaults demo data off', () => {
    expect(readSeedConfig(validEnvironment)).toEqual({
      adminEmail: 'owner@example.test',
      adminPassword: validEnvironment.SEED_ADMIN_PASSWORD,
      seedDemoData: false,
    });
  });

  it.each(['  OWNER+seed@EXAMPLE.TEST  ', 'owner.name@example.test'])(
    'uses the same email contract as login and the public admin response: %s',
    (email) => {
      const config = readSeedConfig({ ...validEnvironment, SEED_ADMIN_EMAIL: email });
      expect(config.adminEmail).toBe(loginRequestSchema.shape.email.parse(email));
      expect(adminUserSchema.shape.email.safeParse(config.adminEmail).success).toBe(true);
      expect(
        loginRequestSchema.safeParse({ email: config.adminEmail, password: config.adminPassword })
          .success,
      ).toBe(true);
    },
  );

  it.each(['owner..name@example.test', '.owner@example.test', 'owner@example.c'])(
    'rejects an email that could previously seed an unusable administrator: %s',
    (email) => {
      expect(loginRequestSchema.shape.email.safeParse(email).success).toBe(false);
      expect(() => readSeedConfig({ ...validEnvironment, SEED_ADMIN_EMAIL: email })).toThrow(
        'SEED_ADMIN_EMAIL must be a valid email address.',
      );
      try {
        readSeedConfig({ ...validEnvironment, SEED_ADMIN_EMAIL: email });
      } catch (error) {
        expect(String(error)).not.toContain(email);
      }
    },
  );

  it('accepts the generated hexadecimal secret format and explicit demo data', () => {
    const config = readSeedConfig({
      ...validEnvironment,
      SEED_ADMIN_PASSWORD: '892d3c1c44c8411766b75cdd7486d5e62a81ba4fa54d9e03',
      SEED_DEMO_DATA: ' true ',
    });

    expect(config.seedDemoData).toBe(true);
  });

  it('rejects missing or weak admin credentials without echoing the password', () => {
    expect(() => readSeedConfig({})).toThrow(SeedConfigError);
    expect(() =>
      readSeedConfig({
        SEED_ADMIN_EMAIL: 'owner@example.test',
        SEED_ADMIN_PASSWORD: 'password',
      }),
    ).toThrow('SEED_ADMIN_PASSWORD must be a unique, non-placeholder password');
  });

  it('rejects long but weak passwords and passwords with accidental padding', () => {
    expect(() =>
      readSeedConfig({
        ...validEnvironment,
        SEED_ADMIN_PASSWORD: '12345678901234567890123456789012',
      }),
    ).toThrow('SEED_ADMIN_PASSWORD must be a unique, non-placeholder password');

    expect(() =>
      readSeedConfig({
        ...validEnvironment,
        SEED_ADMIN_PASSWORD: ` ${validEnvironment.SEED_ADMIN_PASSWORD}`,
      }),
    ).toThrow('SEED_ADMIN_PASSWORD must be a unique, non-placeholder password');
  });

  it('matches the login email maximum', () => {
    const emailAtLimit = `${'a'.repeat(64)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(61)}`;

    expect(emailAtLimit).toHaveLength(MAX_ADMIN_EMAIL_LENGTH);
    expect(readSeedConfig({ ...validEnvironment, SEED_ADMIN_EMAIL: emailAtLimit }).adminEmail).toBe(
      emailAtLimit,
    );
    expect(() =>
      readSeedConfig({ ...validEnvironment, SEED_ADMIN_EMAIL: `${emailAtLimit}e` }),
    ).toThrow(`SEED_ADMIN_EMAIL must be at most ${MAX_ADMIN_EMAIL_LENGTH} characters.`);
  });

  it('matches the bcrypt UTF-8 byte limit without truncating a seed password', () => {
    const passwordAtLimit = 'A1!abcdefghijklmno'.repeat(4);
    const utf8OverlongPassword = `${'A1!abcdefghijklmno'.repeat(3)}😀😀😀😀😀😀😀`;

    expect(Buffer.byteLength(passwordAtLimit, 'utf8')).toBe(MAX_BCRYPT_PASSWORD_BYTES);
    expect(
      readSeedConfig({ ...validEnvironment, SEED_ADMIN_PASSWORD: passwordAtLimit }).adminPassword,
    ).toBe(passwordAtLimit);
    expect(Buffer.byteLength(utf8OverlongPassword, 'utf8')).toBeGreaterThan(
      MAX_BCRYPT_PASSWORD_BYTES,
    );
    expect(() =>
      readSeedConfig({ ...validEnvironment, SEED_ADMIN_PASSWORD: utf8OverlongPassword }),
    ).toThrow(`SEED_ADMIN_PASSWORD must be at most ${MAX_BCRYPT_PASSWORD_BYTES} UTF-8 bytes.`);
  });

  it('rejects an invalid demo-data flag', () => {
    expect(() => readSeedConfig({ ...validEnvironment, SEED_DEMO_DATA: 'yes' })).toThrow(
      'SEED_DEMO_DATA must be either true or false.',
    );
  });

  it('uses the required bcrypt cost', () => {
    expect(BCRYPT_COST).toBeGreaterThanOrEqual(12);
  });
});
