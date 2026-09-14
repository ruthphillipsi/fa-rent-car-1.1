import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { apiErrorSchema, authResponseSchema } from '@fa/shared';
import type { INestApplication } from '@nestjs/common';
import type { PrismaService } from '../dist/database/prisma.service';
import {
  csrf,
  EMAIL,
  integrationApp,
  login,
  responseCookies,
  STAFF_EMAIL,
  TEST_PASSWORD,
} from './helpers';

describe('real PostgreSQL admin sessions', () => {
  let app: INestApplication;
  let database: PrismaService;

  beforeAll(async () => {
    ({ app, database } = await integrationApp());
  });
  afterAll(async () => {
    await app?.close();
  });

  it('rejects guests and forged access cookies with the shared error contract', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/admin/foundation').expect(401);
    expect(apiErrorSchema.parse(response.body).error.code).toBe('SESSION_EXPIRED');
    await request(app.getHttpServer())
      .get('/api/v1/admin/auth/me')
      .set('Cookie', 'fa_access=forged')
      .expect(401);
  });

  it('rejects CSRF, malformed DTOs, and invalid credentials without leaks', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/admin/auth/login')
      .send({ email: EMAIL, password: TEST_PASSWORD })
      .expect(403);
    const form = await csrf(app);
    const invalid = await request(app.getHttpServer())
      .post('/api/v1/admin/auth/login')
      .set('Cookie', form.cookies)
      .set('X-CSRF-Token', form.token)
      .send({ email: 'invalid', password: 'x', role: 'SUPERADMIN' })
      .expect(400);
    expect(apiErrorSchema.parse(invalid.body).error.code).toBe('VALIDATION_ERROR');
    const denied = await request(app.getHttpServer())
      .post('/api/v1/admin/auth/login')
      .set('Cookie', form.cookies)
      .set('X-CSRF-Token', form.token)
      .send({ email: EMAIL, password: 'wrong-password' })
      .expect(401);
    expect(JSON.stringify(denied.body)).not.toContain(EMAIL);
  });

  it('logs in with HttpOnly cookies and stores only refresh hashes', async () => {
    const session = await login(app);
    expect(session.data.user.role).toBe('SUPERADMIN');
    expect(session.response.headers['cache-control']).toBe('no-store');
    const headers = session.response.headers['set-cookie'] as unknown as string[];
    expect(
      headers
        .filter((value) => /fa_(access|refresh)=/.test(value))
        .every((value) => /HttpOnly/i.test(value) && /SameSite=Lax/i.test(value)),
    ).toBe(true);
    const refresh = session.cookies.find((value) => value.startsWith('fa_refresh='))?.split('=')[1];
    const sessions = await database.authSession.findMany({
      where: { adminUserId: session.data.user.id },
    });
    expect(sessions.some((row) => row.refreshTokenHash === refresh)).toBe(false);
    expect(sessions.every((row) => /^[a-f0-9]{64}$/.test(row.refreshTokenHash))).toBe(true);
    const me = await request(app.getHttpServer())
      .get('/api/v1/admin/auth/me')
      .set('Cookie', session.cookies)
      .expect(200);
    expect(authResponseSchema.parse(me.body).user.id).toBe(session.data.user.id);
    expect(JSON.stringify(me.body)).not.toMatch(/passwordHash|refreshTokenHash/);
  });

  it('rotates refresh tokens and revokes the family on replay', async () => {
    const session = await login(app);
    const next = await request(app.getHttpServer())
      .post('/api/v1/admin/auth/refresh')
      .set('Cookie', session.cookies)
      .set('X-CSRF-Token', session.form.token)
      .send({})
      .expect(200);
    const nextCookies = [...session.form.cookies, ...responseCookies(next)];
    await request(app.getHttpServer())
      .get('/api/v1/admin/auth/me')
      .set('Cookie', session.cookies)
      .expect(401);
    await request(app.getHttpServer())
      .get('/api/v1/admin/auth/me')
      .set('Cookie', nextCookies)
      .expect(200);
    await request(app.getHttpServer())
      .post('/api/v1/admin/auth/refresh')
      .set('Cookie', session.cookies)
      .set('X-CSRF-Token', session.form.token)
      .send({})
      .expect(401);
    await request(app.getHttpServer())
      .get('/api/v1/admin/auth/me')
      .set('Cookie', nextCookies)
      .expect(401);
  });

  it('serializes concurrent refreshes using real database connections', async () => {
    const session = await login(app);
    const responses = await Promise.all(
      [1, 2].map(() =>
        request(app.getHttpServer())
          .post('/api/v1/admin/auth/refresh')
          .set('Cookie', session.cookies)
          .set('X-CSRF-Token', session.form.token)
          .send({}),
      ),
    );
    expect(responses.map((response) => response.status).sort()).toEqual([200, 401]);
    const winner = responses.find((response) => response.status === 200);
    expect(winner).toBeDefined();
    await request(app.getHttpServer())
      .get('/api/v1/admin/auth/me')
      .set('Cookie', responseCookies(winner!))
      .expect(401);
  });

  it('makes logout idempotent and invalidates an existing access token immediately', async () => {
    const session = await login(app);
    for (let attempt = 0; attempt < 2; attempt++) {
      await request(app.getHttpServer())
        .post('/api/v1/admin/auth/logout')
        .set('Cookie', session.cookies)
        .set('X-CSRF-Token', session.form.token)
        .send({})
        .expect(200);
    }
    await request(app.getHttpServer())
      .get('/api/v1/admin/auth/me')
      .set('Cookie', session.cookies)
      .expect(401);
  });

  it('does not leave an active session when logout races refresh', async () => {
    const session = await login(app);
    const [refreshed] = await Promise.all([
      request(app.getHttpServer())
        .post('/api/v1/admin/auth/refresh')
        .set('Cookie', session.cookies)
        .set('X-CSRF-Token', session.form.token)
        .send({}),
      request(app.getHttpServer())
        .post('/api/v1/admin/auth/logout')
        .set('Cookie', session.cookies)
        .set('X-CSRF-Token', session.form.token)
        .send({}),
    ]);
    expect([200, 401]).toContain(refreshed.status);
    if (refreshed.status === 200)
      await request(app.getHttpServer())
        .get('/api/v1/admin/auth/me')
        .set('Cookie', responseCookies(refreshed))
        .expect(401);
  });

  it('enforces staff RBAC and checks disabled users on every request', async () => {
    const session = await login(app, STAFF_EMAIL);
    await request(app.getHttpServer())
      .get('/api/v1/admin/system')
      .set('Cookie', session.cookies)
      .expect(403);
    await database.adminUser.update({
      where: { id: session.data.user.id },
      data: { isActive: false },
    });
    await request(app.getHttpServer())
      .get('/api/v1/admin/auth/me')
      .set('Cookie', session.cookies)
      .expect(401);
  });
});
