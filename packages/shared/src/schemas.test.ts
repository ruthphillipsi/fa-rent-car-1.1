import { describe, expect, it } from 'vitest';

import {
  ACCESS_TOKEN_TTL_SECONDS,
  adminApiRoutes,
  adminRoleSchema,
  adminUserSchema,
  apiErrorSchema,
  authResponseSchema,
  businessProfileSchema,
  csrfResponseSchema,
  foundationResponseSchema,
  healthResponseSchema,
  HOLD_MINUTES,
  loginRequestSchema,
  logoutResponseSchema,
  MAX_PAGINATION_SKIP,
  MAX_UPLOAD_BYTES,
  paginationMetadataSchema,
  paginationSchema,
  SIGNED_URL_TTL_SECONDS,
  systemResponseSchema,
  TIMEZONE,
  vehicleCategorySchema,
  vehicleCountsSchema,
  vehicleFuelTypeSchema,
  vehicleSummarySchema,
  vehicleStatusSchema,
  vehicleTransmissionSchema,
} from './index';

const uuid = '123e4567-e89b-42d3-a456-426614174000';
const checkedAt = '2026-09-15T02:00:00.000Z';

const business = {
  name: 'CV FA RENT CAR',
  displayName: 'FA RENT CAR',
  address: 'Jl. Pilang Raya No.10, Cirebon',
  whatsapp: '085224484488',
  operatingHours: '24 jam',
  timezone: TIMEZONE,
  holdMinutes: HOLD_MINUTES,
  bufferMinutes: 0,
};

const vehicle = {
  id: uuid,
  brand: 'Toyota',
  model: 'Innova',
  variant: null,
  plate: 'E 1234 FA',
  year: 2024,
  category: 'MPV',
  transmission: 'AUTOMATIC',
  fuelType: 'GASOLINE',
  capacity: 7,
  luggageCount: 3,
  mileage: 12_345,
  facilities: ['AC', 'Bluetooth'],
  status: 'AVAILABLE',
  isDemo: true,
  dailyRate: 450_000,
};

const vehicleCounts = {
  total: 5,
  demo: 2,
  byStatus: { AVAILABLE: 1, RENTED: 1, HELD: 1, MAINTENANCE: 1, INACTIVE: 1 },
};

const pagination = {
  page: 1,
  limit: 1,
  total: 5,
  totalPages: 5,
  hasPreviousPage: false,
  hasNextPage: true,
};

describe('shared API schemas', () => {
  it('normalizes a login request and rejects unknown input or bcrypt-overlong passwords', () => {
    expect(
      loginRequestSchema.parse({
        email: '  OWNER@EXAMPLE.TEST  ',
        password: 'correct horse battery staple',
      }),
    ).toEqual({
      email: 'owner@example.test',
      password: 'correct horse battery staple',
    });

    expect(
      loginRequestSchema.safeParse({
        email: 'owner@example.test',
        password: 'password',
        role: 'SUPERADMIN',
      }).success,
    ).toBe(false);
    expect(
      loginRequestSchema.safeParse({ email: 'owner@example.test', password: '' }).success,
    ).toBe(false);
    expect(
      loginRequestSchema.safeParse({ email: 'owner@example.test', password: 'a'.repeat(73) })
        .success,
    ).toBe(false);
    expect(
      loginRequestSchema.safeParse({ email: 'owner@example.test', password: '😀'.repeat(18) })
        .success,
    ).toBe(true);
    expect(
      loginRequestSchema.safeParse({ email: 'owner@example.test', password: '😀'.repeat(19) })
        .success,
    ).toBe(false);
  });

  it('accepts only the defined admin roles and user shape', () => {
    expect(adminRoleSchema.options).toEqual(['STAFF', 'SUPERADMIN']);
    expect(
      adminUserSchema.parse({
        id: uuid,
        name: 'Ruth Phillips',
        email: 'ruth@example.test',
        role: 'SUPERADMIN',
      }),
    ).toMatchObject({ role: 'SUPERADMIN' });
    expect(
      adminUserSchema.safeParse({ id: 'not-a-uuid', name: 'Ruth', email: 'bad', role: 'OWNER' })
        .success,
    ).toBe(false);
  });

  it('enforces datetime, CSRF, auth, health, error, and logout response contracts', () => {
    const user = {
      id: uuid,
      name: 'Ruth Phillips',
      email: 'ruth@example.test',
      role: 'SUPERADMIN',
    };

    expect(authResponseSchema.parse({ user, expiresAt: checkedAt })).toEqual({
      user,
      expiresAt: checkedAt,
    });
    expect(authResponseSchema.safeParse({ user, expiresAt: '2026-09-15' }).success).toBe(false);
    expect(csrfResponseSchema.safeParse({ csrfToken: 'a'.repeat(64) }).success).toBe(true);
    expect(csrfResponseSchema.safeParse({ csrfToken: 'a'.repeat(63) }).success).toBe(false);
    expect(
      healthResponseSchema.parse({ status: 'ok', service: 'fa-rent-car-api', time: checkedAt }),
    ).toMatchObject({ status: 'ok', service: 'fa-rent-car-api' });
    expect(
      apiErrorSchema.parse({
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid input.',
          details: [{ path: 'email', message: 'Required' }],
        },
      }),
    ).toMatchObject({ error: { code: 'INVALID_INPUT' } });
    expect(logoutResponseSchema.parse({ success: true })).toEqual({ success: true });
    expect(logoutResponseSchema.safeParse({ success: false }).success).toBe(false);
  });

  it('applies safe pagination defaults and boundaries', () => {
    expect(paginationSchema.parse({})).toEqual({ page: 1, limit: 20 });
    expect(paginationSchema.parse({ page: '2', limit: '100' })).toEqual({ page: 2, limit: 100 });
    expect(paginationSchema.safeParse({ page: 0, limit: 20 }).success).toBe(false);
    expect(paginationSchema.safeParse({ page: 1, limit: 101 }).success).toBe(false);
    expect(paginationSchema.parse({ page: MAX_PAGINATION_SKIP + 1, limit: 1 })).toEqual({
      page: MAX_PAGINATION_SKIP + 1,
      limit: 1,
    });
    expect(
      paginationSchema.safeParse({ page: MAX_PAGINATION_SKIP / 100 + 1, limit: 100 }).success,
    ).toBe(true);
    expect(
      paginationSchema.safeParse({ page: MAX_PAGINATION_SKIP / 100 + 2, limit: 100 }).success,
    ).toBe(false);
    expect(paginationSchema.safeParse({ page: MAX_PAGINATION_SKIP + 2, limit: 1 }).success).toBe(
      false,
    );
  });

  it.each([
    { page: ['1', '2'] },
    { page: ['1'] },
    { page: true },
    { page: null },
    { page: '01' },
    { page: '1.0' },
    { page: 1.5 },
    { page: Number.MAX_SAFE_INTEGER },
    { limit: '' },
    { limit: [] },
    { limit: '1e2' },
    { limit: '0x10' },
    { limit: ' 20 ' },
    { limit: 'Infinity' },
    { limit: 0 },
    { page: 1, sort: 'brand' },
  ])('rejects ambiguous or unsupported pagination input: %j', (query) => {
    expect(paginationSchema.safeParse(query).success).toBe(false);
  });

  it('validates business and vehicle summaries used by the foundation endpoint', () => {
    expect(vehicleCategorySchema.options).toEqual(['MPV', 'SUV', 'CITY_CAR', 'SEDAN', 'VAN']);
    expect(vehicleTransmissionSchema.options).toEqual(['MANUAL', 'AUTOMATIC']);
    expect(vehicleFuelTypeSchema.options).toEqual(['GASOLINE', 'DIESEL', 'HYBRID', 'ELECTRIC']);
    expect(vehicleStatusSchema.options).toEqual([
      'AVAILABLE',
      'RENTED',
      'HELD',
      'MAINTENANCE',
      'INACTIVE',
    ]);
    expect(businessProfileSchema.parse(business)).toEqual(business);
    expect(businessProfileSchema.safeParse({ ...business, timezone: 'UTC' }).success).toBe(false);
    expect(vehicleSummarySchema.parse(vehicle)).toEqual(vehicle);
    expect(
      vehicleSummarySchema.parse({ ...vehicle, brand: null, model: null, dailyRate: null }),
    ).toMatchObject({
      brand: null,
      model: null,
      dailyRate: null,
    });
    expect(vehicleSummarySchema.safeParse({ ...vehicle, category: 'TRUCK' }).success).toBe(false);
    expect(vehicleSummarySchema.parse({ ...vehicle, dailyRate: 0 }).dailyRate).toBe(0);
    expect(vehicleSummarySchema.safeParse({ ...vehicle, dailyRate: -1 }).success).toBe(false);
    expect(vehicleSummarySchema.safeParse({ ...vehicle, dailyRate: 0.5 }).success).toBe(false);
  });

  it('validates foundation and system readiness response contracts', () => {
    expect(
      foundationResponseSchema.parse({
        business,
        vehicles: [vehicle],
        pagination,
        vehicleCounts,
        phase: 'FOUNDATION',
        checkedAt,
      }),
    ).toMatchObject({ phase: 'FOUNDATION', vehicles: [vehicle], pagination, vehicleCounts });
    expect(
      systemResponseSchema.parse({
        database: 'connected',
        queue: 'connected',
        storage: 'connected',
        checkedAt,
      }),
    ).toMatchObject({ database: 'connected', queue: 'connected', storage: 'connected' });
    expect(
      systemResponseSchema.safeParse({
        database: 'disconnected',
        queue: 'connected',
        storage: 'connected',
        checkedAt,
      }).success,
    ).toBe(false);
  });

  it('validates aggregate counts independently of the current page and rejects inconsistent totals', () => {
    const response = {
      business,
      vehicles: [vehicle],
      pagination,
      vehicleCounts,
      phase: 'FOUNDATION',
      checkedAt,
    };
    expect(foundationResponseSchema.parse(response).vehicleCounts.total).toBe(5);
    expect(paginationMetadataSchema.safeParse({ ...pagination, limit: 101 }).success).toBe(false);
    expect(vehicleCountsSchema.safeParse({ ...vehicleCounts, demo: 6 }).success).toBe(false);
    expect(vehicleCountsSchema.safeParse({ ...vehicleCounts, total: 4 }).success).toBe(false);
    expect(
      vehicleCountsSchema.safeParse({
        ...vehicleCounts,
        byStatus: { ...vehicleCounts.byStatus, HELD: -1 },
      }).success,
    ).toBe(false);
    expect(
      foundationResponseSchema.safeParse({ ...response, pagination: { ...pagination, total: 1 } })
        .success,
    ).toBe(false);
    expect(
      foundationResponseSchema.safeParse({ ...response, vehicles: [vehicle, vehicle] }).success,
    ).toBe(false);
  });

  it('supports an empty fleet with zero aggregates and no navigation targets', () => {
    const response = foundationResponseSchema.parse({
      business,
      vehicles: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      },
      vehicleCounts: {
        total: 0,
        demo: 0,
        byStatus: { AVAILABLE: 0, RENTED: 0, HELD: 0, MAINTENANCE: 0, INACTIVE: 0 },
      },
      phase: 'FOUNDATION',
      checkedAt,
    });
    expect(response.vehicles).toEqual([]);
    expect(response.vehicleCounts.total).toBe(0);
    expect(response.pagination.hasNextPage).toBe(false);
  });

  it('exports phase-zero constants and exact admin endpoint routes', () => {
    expect(TIMEZONE).toBe('Asia/Jakarta');
    expect(HOLD_MINUTES).toBe(120);
    expect(MAX_UPLOAD_BYTES).toBe(5 * 1024 * 1024);
    expect(SIGNED_URL_TTL_SECONDS).toBe(300);
    expect(ACCESS_TOKEN_TTL_SECONDS).toBe(900);
    expect(adminApiRoutes).toEqual({
      auth: {
        csrf: '/api/v1/admin/auth/csrf',
        login: '/api/v1/admin/auth/login',
        refresh: '/api/v1/admin/auth/refresh',
        logout: '/api/v1/admin/auth/logout',
        me: '/api/v1/admin/auth/me',
      },
      foundation: '/api/v1/admin/foundation',
      system: '/api/v1/admin/system',
    });
  });
});
