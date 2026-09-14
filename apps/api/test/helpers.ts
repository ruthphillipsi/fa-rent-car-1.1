import bcrypt from 'bcrypt';
import { createRequire } from 'node:module';
import request from 'supertest';
import { authResponseSchema, csrfResponseSchema } from '@fa/shared';
import type { INestApplication } from '@nestjs/common';

// Load compiled Nest providers through one CJS registry, preserving decorator identity.
const loadCompiled = createRequire(`${process.cwd()}/test/helpers.ts`);
const { createApp } = loadCompiled('../dist/create-app.js') as typeof import('../dist/create-app');
const { PrismaService } = loadCompiled(
  '../dist/database/prisma.service.js',
) as typeof import('../dist/database/prisma.service');
export const { JobsService } = loadCompiled(
  '../dist/jobs/jobs.service.js',
) as typeof import('../dist/jobs/jobs.service');
export const { StorageService } = loadCompiled(
  '../dist/storage/storage.service.js',
) as typeof import('../dist/storage/storage.service');

export const TEST_PASSWORD = 'Synthetic-integration-only-452x!';
export const EMAIL = 'admin@integration.example.test';
export const STAFF_EMAIL = 'staff@integration.example.test';

export async function integrationApp() {
  if (!new URL(process.env.DATABASE_URL ?? '').searchParams.get('schema')?.startsWith('fa_test_'))
    throw new Error('Missing isolated test schema');
  const app = await createApp(false);
  await app.init();
  const database = app.get(PrismaService);
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);
  for (const [email, role] of [
    [EMAIL, 'SUPERADMIN'],
    [STAFF_EMAIL, 'STAFF'],
  ] as const) {
    await database.adminUser.upsert({
      where: { email },
      update: { isActive: true, deletedAt: null, role },
      create: { name: 'Admin Pengujian', email, role, passwordHash },
    });
  }
  return { app, database };
}

export function responseCookies(response: request.Response): string[] {
  const header: unknown = response.headers['set-cookie'];
  if (!Array.isArray(header) || !header.every((value) => typeof value === 'string')) return [];
  return header.map((value: string) => value.split(';')[0] ?? '');
}

export async function csrf(app: INestApplication) {
  const response = await request(app.getHttpServer()).get('/api/v1/admin/auth/csrf').expect(200);
  return {
    token: csrfResponseSchema.parse(response.body).csrfToken,
    cookies: responseCookies(response),
  };
}

export async function login(app: INestApplication, email = EMAIL) {
  const form = await csrf(app);
  const response = await request(app.getHttpServer())
    .post('/api/v1/admin/auth/login')
    .set('Cookie', form.cookies)
    .set('X-CSRF-Token', form.token)
    .send({ email, password: TEST_PASSWORD })
    .expect(200);
  return {
    form,
    cookies: [...form.cookies, ...responseCookies(response)],
    response,
    data: authResponseSchema.parse(response.body),
  };
}
