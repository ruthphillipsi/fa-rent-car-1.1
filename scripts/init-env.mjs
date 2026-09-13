import { randomBytes } from 'node:crypto';
import { existsSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envFile = resolve(rootDir, '.env');

if (!existsSync(envFile)) {
  const secret = () => randomBytes(36).toString('hex');
  const database = secret();
  const redis = secret();
  const storage = secret();
  const values = {
    NODE_ENV: 'development',
    API_PORT: '4000',
    API_INTERNAL_URL: 'http://127.0.0.1:4000',
    POSTGRES_USER: 'fa',
    POSTGRES_DB: 'fa_rent_car',
    POSTGRES_PASSWORD: database,
    DATABASE_URL: `postgresql://fa:${database}@127.0.0.1:5432/fa_rent_car?schema=public`,
    REDIS_PASSWORD: redis,
    REDIS_URL: `redis://:${redis}@127.0.0.1:6379`,
    MINIO_ROOT_USER: 'fa-local',
    MINIO_ROOT_PASSWORD: storage,
    S3_ENDPOINT: 'http://127.0.0.1:9000',
    S3_REGION: 'us-east-1',
    S3_BUCKET: 'fa-private',
    S3_ACCESS_KEY: 'fa-local',
    S3_SECRET_KEY: storage,
    JWT_SECRET: secret(),
    SEED_ADMIN_EMAIL: 'admin@example.test',
    SEED_ADMIN_PASSWORD: secret(),
    SEED_DEMO_DATA: 'true',
  };
  try {
    writeFileSync(envFile, Object.entries(values).map(([key, value]) => `${key}=${value}\n`).join(''), {
      mode: 0o600,
      flag: 'wx',
    });
    process.stdout.write('Created private .env with unique local credentials. Existing environments are never overwritten.\n');
  } catch (error) {
    if (!(error && typeof error === 'object' && 'code' in error && error.code === 'EEXIST')) {
      throw error;
    }
  }
}
