import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import type { Prisma } from '@fa/db';
import {
  apiErrorSchema,
  foundationResponseSchema,
  MAX_PAGINATION_SKIP,
  vehicleStatusSchema,
} from '@fa/shared';
import type { INestApplication } from '@nestjs/common';
import type { PrismaService } from '../dist/database/prisma.service';
import { integrationApp, login, STAFF_EMAIL } from './helpers';

const vehicleIds = Array.from(
  { length: 105 },
  (_, index) => `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
);
const vehicles: Prisma.VehicleCreateManyInput[] = vehicleIds.map((id, index) => ({
  id,
  brand: 'Synthetic Foundation',
  model: 'Identical Sort Key',
  variant: 'Test fixture',
  year: 2026,
  plate: `FOUNDATION-${index + 1}`,
  color: 'Synthetic',
  transmission: 'MANUAL',
  category: 'MPV',
  fuelType: 'GASOLINE',
  capacity: 7,
  luggageCount: 2,
  mileage: 0,
  facilities: [],
  description: 'Synthetic pagination fixture; not a real rental vehicle.',
  status: vehicleStatusSchema.options[index % vehicleStatusSchema.options.length] ?? 'INACTIVE',
  isDemo: index >= 100,
}));
const expectedCounts = {
  total: 105,
  demo: 5,
  byStatus: { AVAILABLE: 21, RENTED: 21, HELD: 21, MAINTENANCE: 21, INACTIVE: 21 },
};

describe('paginated foundation inventory', () => {
  let app: INestApplication;
  let database: PrismaService;
  let cookies: string[];

  beforeAll(async () => {
    ({ app, database } = await integrationApp());
    await database.setting.upsert({
      where: { key: 'business' },
      update: {},
      create: {
        key: 'business',
        value: {
          name: 'Synthetic Foundation Business',
          displayName: 'Foundation Integration',
          address: 'Synthetic fixture address',
          whatsapp: '620000000000',
          operatingHours: '24 jam',
          timezone: 'Asia/Jakarta',
          holdMinutes: 120,
          bufferMinutes: 0,
        },
      },
    });
    await database.vehicle.createMany({ data: [...vehicles].reverse() });
    await database.vehicle.create({
      data: {
        ...vehicles[0]!,
        id: '00000000-0000-4000-8000-000000000106',
        plate: 'FOUNDATION-DELETED',
        isDemo: true,
        deletedAt: new Date(),
      },
    });
    await database.vehicleRate.create({ data: { vehicleId: vehicleIds[0]!, daily: 0 } });
    cookies = (await login(app)).cookies;
  });

  afterAll(async () => {
    await app?.close();
  });

  async function overview(query = '') {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/admin/foundation${query}`)
      .set('Cookie', cookies)
      .expect(200);
    return foundationResponseSchema.parse(response.body);
  }

  it('requires an admin session and permits staff read-only inventory access', async () => {
    await request(app.getHttpServer()).get('/api/v1/admin/foundation').expect(401);
    const staff = await login(app, STAFF_EMAIL);
    const response = await request(app.getHttpServer())
      .get('/api/v1/admin/foundation?limit=1')
      .set('Cookie', staff.cookies)
      .expect(200);
    expect(foundationResponseSchema.parse(response.body).vehicleCounts).toEqual(expectedCounts);
  });

  it('defaults to 20 records and preserves a database-valid zero daily rate', async () => {
    const response = await overview();
    expect(response.vehicles.map((vehicle) => vehicle.id)).toEqual(vehicleIds.slice(0, 20));
    expect(response.vehicles[0]?.dailyRate).toBe(0);
    expect(response.vehicles[1]?.dailyRate).toBeNull();
    expect(response.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 105,
      totalPages: 6,
      hasPreviousPage: false,
      hasNextPage: true,
    });
  });

  it('keeps all status and demo counts aggregate even when the page has no demo vehicles', async () => {
    const response = await overview('?page=1&limit=1');
    expect(response.vehicles).toHaveLength(1);
    expect(response.vehicles[0]?.isDemo).toBe(false);
    expect(response.vehicleCounts).toEqual(expectedCounts);
    expect(response.pagination.total).toBe(expectedCounts.total);
  });

  it('uses an id tie-breaker across bounded pages and excludes soft-deleted inventory', async () => {
    const first = await overview('?page=1&limit=100');
    const second = await overview('?page=2&limit=100');
    expect(first.vehicles).toHaveLength(100);
    expect(second.vehicles).toHaveLength(5);
    expect([...first.vehicles, ...second.vehicles].map((vehicle) => vehicle.id)).toEqual(
      vehicleIds,
    );
    expect(first.vehicleCounts).toEqual(expectedCounts);
    expect(second.vehicleCounts).toEqual(expectedCounts);
    expect(second.pagination).toEqual({
      page: 2,
      limit: 100,
      total: 105,
      totalPages: 2,
      hasPreviousPage: true,
      hasNextPage: false,
    });
  });

  it('returns empty rows but unchanged aggregates at the maximum supported offset', async () => {
    const response = await overview(`?page=${MAX_PAGINATION_SKIP + 1}&limit=1`);
    expect(response.vehicles).toEqual([]);
    expect(response.vehicleCounts).toEqual(expectedCounts);
    expect(response.pagination).toMatchObject({
      page: MAX_PAGINATION_SKIP + 1,
      total: 105,
      hasPreviousPage: true,
      hasNextPage: false,
    });
  });

  it.each([
    'page=0',
    'page=-1',
    'page=1.5',
    'page=1e2',
    'page=0x10',
    'page=%202',
    'page=01',
    'page=1&page=2',
    'page[value]=1',
    'limit=0',
    'limit=101',
    'limit=',
    'limit=true',
    'limit=1&limit=2',
    'status=AVAILABLE',
    `page=${MAX_PAGINATION_SKIP + 2}&limit=1`,
    `page=${MAX_PAGINATION_SKIP / 100 + 2}&limit=100`,
  ])('rejects unsupported query input with the shared error contract: %s', async (query) => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/admin/foundation?${query}`)
      .set('Cookie', cookies)
      .expect(400);
    expect(apiErrorSchema.parse(response.body).error.code).toBe('VALIDATION_ERROR');
  });
});
