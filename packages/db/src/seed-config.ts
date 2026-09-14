import { loginRequestSchema } from '@fa/shared';

export const BCRYPT_COST = 12;
export const MAX_ADMIN_EMAIL_LENGTH = 254;
export const MAX_BCRYPT_PASSWORD_BYTES = 72;

export const BUSINESS_SETTING_VALUE = {
  name: 'CV FA RENT CAR',
  displayName: 'FA RENT CAR',
  address: 'Jl. Pilang Raya No.10, Pilangsari, Kedawung, Cirebon',
  whatsapp: '6285224484488',
  operatingHours: '24 jam',
  timezone: 'Asia/Jakarta',
  holdMinutes: 120,
  bufferMinutes: 0,
};

export interface SeedConfig {
  adminEmail: string;
  adminPassword: string;
  seedDemoData: boolean;
}

export class SeedConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SeedConfigError';
  }
}

function requireValue(environment: NodeJS.ProcessEnv, name: string): string {
  const value = environment[name];

  if (!value || value.trim() === '') {
    throw new SeedConfigError(`${name} is required to seed the database.`);
  }

  return value;
}

function validatePassword(password: string, email: string): void {
  if (Buffer.byteLength(password, 'utf8') > MAX_BCRYPT_PASSWORD_BYTES) {
    throw new SeedConfigError(
      `SEED_ADMIN_PASSWORD must be at most ${MAX_BCRYPT_PASSWORD_BYTES} UTF-8 bytes.`,
    );
  }

  const characterGroups = [/[a-z]/u, /[A-Z]/u, /\d/u, /[^a-zA-Z\d]/u].filter((pattern) =>
    pattern.test(password),
  ).length;
  const distinctCharacters = new Set(password).size;
  const placeholder = /^(password|changeme|replace-with)/iu.test(password);
  const mixedSecret = characterGroups >= 3 && distinctCharacters >= 8;
  const generatedSecret = password.length >= 32 && characterGroups >= 2 && distinctCharacters >= 12;

  if (
    password.length < 16 ||
    password !== password.trim() ||
    password.toLowerCase() === email ||
    placeholder ||
    (!mixedSecret && !generatedSecret)
  ) {
    throw new SeedConfigError(
      'SEED_ADMIN_PASSWORD must be a unique, non-placeholder password of at least 16 characters.',
    );
  }
}

function readDemoDataFlag(value: string | undefined): boolean {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return false;
  }

  if (normalizedValue === 'true') {
    return true;
  }

  if (normalizedValue === 'false') {
    return false;
  }

  throw new SeedConfigError('SEED_DEMO_DATA must be either true or false.');
}

export function readSeedConfig(environment: NodeJS.ProcessEnv = process.env): SeedConfig {
  const email = loginRequestSchema.shape.email.safeParse(
    requireValue(environment, 'SEED_ADMIN_EMAIL'),
  );
  const adminPassword = requireValue(environment, 'SEED_ADMIN_PASSWORD');

  if (!email.success) {
    if (email.error.issues.some((issue) => issue.code === 'too_big')) {
      throw new SeedConfigError(
        `SEED_ADMIN_EMAIL must be at most ${MAX_ADMIN_EMAIL_LENGTH} characters.`,
      );
    }
    throw new SeedConfigError('SEED_ADMIN_EMAIL must be a valid email address.');
  }

  const adminEmail = email.data;
  validatePassword(adminPassword, adminEmail);

  return {
    adminEmail,
    adminPassword,
    seedDemoData: readDemoDataFlag(environment.SEED_DEMO_DATA),
  };
}
