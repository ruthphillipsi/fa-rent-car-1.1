import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import type { INestApplication } from '@nestjs/common';
import type { Environment } from '../src/config/environment';
import type { PrismaService } from '../dist/database/prisma.service';
import { createStorageClient } from '../dist/storage/storage-client';
import { csrf, integrationApp, login, STAFF_EMAIL, StorageService, TEST_PASSWORD } from './helpers';

describe('security regressions with real services', () => {
  let app: INestApplication;
  let database: PrismaService;

  beforeEach(async () => {
    ({ app, database } = await integrationApp());
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await app?.close();
  });

  it('limits one account without blocking another behind the same proxy or trusting forged IP headers', async () => {
    const form = await csrf(app);
    for (let attempt = 0; attempt < 11; attempt++) {
      await request(app.getHttpServer())
        .post('/api/v1/admin/auth/login')
        .set('Cookie', form.cookies)
        .set('X-CSRF-Token', form.token)
        .set('X-Forwarded-For', `198.51.100.${attempt + 1}`)
        .send({
          email: attempt % 2 === 0 ? 'target@example.test' : ' TARGET@EXAMPLE.TEST ',
          password: 'incorrect-password',
        })
        .expect(attempt < 10 ? 401 : 429);
    }
    await request(app.getHttpServer())
      .post('/api/v1/admin/auth/login')
      .set('Cookie', form.cookies)
      .set('X-CSRF-Token', form.token)
      .send({ email: STAFF_EMAIL, password: TEST_PASSWORD })
      .expect(200);
  });

  it('preserves session cookies after a transient pre-rotation failure, then allows retry', async () => {
    const session = await login(app);
    vi.spyOn(database, '$transaction').mockRejectedValueOnce(
      new Error('Synthetic database timeout'),
    );
    const failed = await request(app.getHttpServer())
      .post('/api/v1/admin/auth/refresh')
      .set('Cookie', session.cookies)
      .set('X-CSRF-Token', session.form.token)
      .send({})
      .expect(500);
    expect(failed.headers['set-cookie']).toBeUndefined();
    expect(JSON.stringify(failed.body)).not.toContain('Synthetic database timeout');
    await request(app.getHttpServer())
      .post('/api/v1/admin/auth/refresh')
      .set('Cookie', session.cookies)
      .set('X-CSRF-Token', session.form.token)
      .send({})
      .expect(200);
  });

  it('still clears credentials when a refresh token is invalid', async () => {
    const form = await csrf(app);
    const denied = await request(app.getHttpServer())
      .post('/api/v1/admin/auth/refresh')
      .set('Cookie', [...form.cookies, 'fa_refresh=invalid'])
      .set('X-CSRF-Token', form.token)
      .send({})
      .expect(401);
    const cookies = denied.headers['set-cookie'] as unknown as string[];
    expect(
      cookies.some((cookie) => cookie.startsWith('fa_access=;') && cookie.includes('1970')),
    ).toBe(true);
    expect(
      cookies.some((cookie) => cookie.startsWith('fa_refresh=;') && cookie.includes('1970')),
    ).toBe(true);
  });

  it('uploads nonempty bytes through a scoped presigned URL and denies unsigned downloads', async () => {
    const config = app.get(ConfigService<Environment, true>);
    const storage = app.get(StorageService);
    const cleanup = createStorageClient({
      S3_ENDPOINT: config.get('S3_ENDPOINT', { infer: true }),
      S3_REGION: config.get('S3_REGION', { infer: true }),
      S3_ACCESS_KEY: config.get('S3_ACCESS_KEY', { infer: true }),
      S3_SECRET_KEY: config.get('S3_SECRET_KEY', { infer: true }),
    });
    const ownerId = randomUUID();
    const bytes = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a8N0AAAAASUVORK5CYII=',
      'base64',
    );
    const upload = await storage.createStagingUpload({
      ownerId,
      contentType: 'image/png',
      byteLength: bytes.length,
    });
    try {
      const response = await fetch(upload.url, {
        method: 'PUT',
        headers: { 'Content-Type': 'image/png' },
        body: bytes,
      });
      expect(response.status).toBe(200);
      const download = await storage.createStagingDownload(ownerId, upload.objectKey);
      const downloaded = await fetch(download);
      expect(downloaded.status).toBe(200);
      expect(Buffer.from(await downloaded.arrayBuffer())).toEqual(bytes);
      const unsigned = new URL(download);
      unsigned.search = '';
      expect((await fetch(unsigned)).status).toBe(403);
      await expect(storage.createStagingDownload(randomUUID(), upload.objectKey)).rejects.toThrow(
        'authorized scope',
      );
    } finally {
      await cleanup.send(
        new DeleteObjectCommand({
          Bucket: config.get('S3_BUCKET', { infer: true }),
          Key: upload.objectKey,
        }),
      );
      cleanup.destroy();
    }
  });
});
