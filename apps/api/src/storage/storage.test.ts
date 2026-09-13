import { randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import type { Environment } from '../config/environment';
import { assertObjectOwnership, StorageService } from './storage.service';

function service() {
  return new StorageService(
    new ConfigService<Environment, true>({
      S3_ENDPOINT: 'http://localhost:9000',
      S3_REGION: 'us-east-1',
      S3_BUCKET: 'test-private',
      S3_ACCESS_KEY: 'synthetic-key',
      S3_SECRET_KEY: 'synthetic-secret-not-a-real-credential',
    }),
  );
}

describe('private staging storage', () => {
  it('uses random object keys and five-minute signatures', async () => {
    const storage = service();
    try {
      const ownerId = randomUUID();
      const upload = await storage.createStagingUpload({
        ownerId,
        contentType: 'image/png',
        byteLength: 128,
      });
      expect(upload.objectKey).toMatch(new RegExp(`^staging/admin/${ownerId}/[a-f0-9-]{36}$`));
      expect(new URL(upload.url).searchParams.get('X-Amz-Expires')).toBe('300');
      expect(upload.expiresIn).toBe(300);
    } finally {
      storage.onModuleDestroy();
    }
  });

  it('rejects oversized or empty files before issuing a signature', async () => {
    const storage = service();
    try {
      const ownerId = randomUUID();
      for (const byteLength of [0, -1, 5 * 1024 * 1024 + 1, 1.5]) {
        await expect(
          storage.createStagingUpload({ ownerId, contentType: 'image/png', byteLength }),
        ).rejects.toThrow();
      }
    } finally {
      storage.onModuleDestroy();
    }
  });

  it('rejects other owners, traversal, and arbitrary object paths', () => {
    const ownerId = randomUUID();
    const key = `staging/admin/${ownerId}/${randomUUID()}`;
    expect(() => assertObjectOwnership(ownerId, key)).not.toThrow();
    expect(() => assertObjectOwnership(randomUUID(), key)).toThrow();
    expect(() => assertObjectOwnership(ownerId, `${key}/../../file`)).toThrow();
    expect(() => assertObjectOwnership(ownerId, 'other/private.pdf')).toThrow();
  });
});
