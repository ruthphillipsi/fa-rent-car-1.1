import { describe, expect, it } from 'vitest';
import { redisConnection } from './jobs.service';

describe('Redis connection configuration', () => {
  it('supports encoded credentials and isolated test databases', () => {
    expect(redisConnection('redis://test:synthetic%3Apassword@localhost:6380/3')).toMatchObject({
      host: 'localhost',
      port: 6380,
      username: 'test',
      password: 'synthetic:password',
      db: 3,
      maxRetriesPerRequest: 1,
    });
  });

  it('preserves TLS rather than silently downgrading rediss', () => {
    expect(redisConnection('rediss://localhost')).toMatchObject({ port: 6379, db: 0, tls: {} });
  });
});
