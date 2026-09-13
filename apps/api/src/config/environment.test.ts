import { describe, expect, it } from 'vitest';
import { validateEnvironment } from './environment';

const environment = {
  DATABASE_URL: 'postgresql://fa:synthetic-password@localhost:5432/fa_test',
  REDIS_URL: 'redis://localhost:6379',
  JWT_SECRET: 'synthetic-test-secret-'.repeat(4),
  S3_ENDPOINT: 'http://localhost:9000',
  S3_REGION: 'us-east-1',
  S3_BUCKET: 'test-private',
  S3_ACCESS_KEY: 'synthetic-access-key',
  S3_SECRET_KEY: 'synthetic-storage-secret',
};

describe('environment validation', () => {
  it('validates required services and safe defaults', () => {
    expect(validateEnvironment(environment)).toMatchObject({
      API_PORT: 4000,
      NODE_ENV: 'development',
      JOB_QUEUE_NAME: 'fa-system',
    });
  });

  it('fails without exposing configuration values', () => {
    expect(() => validateEnvironment({ ...environment, JWT_SECRET: 'private-value' })).toThrow(
      'JWT_SECRET',
    );
    try {
      validateEnvironment({ ...environment, JWT_SECRET: 'private-value' });
    } catch (error) {
      expect(String(error)).not.toContain('private-value');
    }
  });

  it.each([
    { DATABASE_URL: 'file:unsafe.db' },
    { REDIS_URL: 'https://example.test' },
    { API_PORT: '70000' },
    { JOB_QUEUE_NAME: 'unscoped:queue' },
  ])('rejects unsupported settings', (override) => {
    expect(() => validateEnvironment({ ...environment, ...override })).toThrow();
  });
});
