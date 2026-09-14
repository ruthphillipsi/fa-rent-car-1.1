import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { healthResponseSchema } from '@fa/shared';
import type { INestApplication } from '@nestjs/common';
import type { PrismaService } from '../dist/database/prisma.service';
import { csrf, EMAIL, integrationApp, JobsService, login, TEST_PASSWORD } from './helpers';

describe('migrations and supporting services', () => {
  let app: INestApplication;
  let database: PrismaService;
  beforeAll(async () => {
    ({ app, database } = await integrationApp());
  });
  afterAll(async () => {
    await app?.close();
  });

  it('checks real PostgreSQL, Redis worker, and private MinIO', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    expect(healthResponseSchema.parse(response.body).status).toBe('ok');
    const schedulers = await app.get(JobsService).queue.getJobSchedulers();
    expect(schedulers.some((scheduler) => scheduler.key === 'foundation-heartbeat')).toBe(true);
  });

  it('enforces append-only audit logs for update, delete, and truncate', async () => {
    const session = await login(app);
    const log = await database.auditLog.findFirstOrThrow({
      where: { actorId: session.data.user.id, action: 'AUTH_LOGIN' },
    });
    await expect(
      database.auditLog.update({ where: { id: log.id }, data: { action: 'ALTERED' } }),
    ).rejects.toThrow();
    await expect(database.auditLog.delete({ where: { id: log.id } })).rejects.toThrow();
    await expect(database.$executeRaw`TRUNCATE TABLE audit_logs`).rejects.toThrow();
    expect((await database.auditLog.findUniqueOrThrow({ where: { id: log.id } })).action).toBe(
      'AUTH_LOGIN',
    );
    const serialized = JSON.stringify(await database.auditLog.findMany());
    expect(serialized).not.toContain(TEST_PASSWORD);
    expect(serialized).not.toContain('refreshToken');
  });

  it('keeps session creation atomic with its audit entry', async () => {
    const user = await database.adminUser.findUniqueOrThrow({ where: { email: EMAIL } });
    const before = await database.authSession.count();
    await expect(
      database.$transaction(async (transaction) => {
        await transaction.authSession.create({
          data: {
            adminUserId: user.id,
            refreshTokenHash: 'f'.repeat(64),
            expiresAt: new Date(Date.now() + 60_000),
          },
        });
        throw new Error('Synthetic audit failure');
      }),
    ).rejects.toThrow('Synthetic audit failure');
    expect(await database.authSession.count()).toBe(before);
  });

  it('throttles repeated login attempts', async () => {
    const form = await csrf(app);
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 11; attempt++) {
      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/auth/login')
        .set('Cookie', form.cookies)
        .set('X-CSRF-Token', form.token)
        .send({ email: EMAIL, password: 'wrong-password' });
      statuses.push(response.status);
    }
    expect(statuses).toContain(401);
    expect(statuses).toContain(429);
  });
});
