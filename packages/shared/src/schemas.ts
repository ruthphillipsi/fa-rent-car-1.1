import { z } from 'zod';

import { TIMEZONE } from './constants';

function utf8ByteLength(value: string): number {
  let length = 0;

  for (const character of value) {
    const codePoint = character.codePointAt(0);

    if (codePoint === undefined) {
      continue;
    }

    if (codePoint <= 0x7f) {
      length += 1;
    } else if (codePoint <= 0x7ff) {
      length += 2;
    } else if (codePoint <= 0xffff) {
      length += 3;
    } else {
      length += 4;
    }
  }

  return length;
}

export const isoDateTimeSchema = z.iso.datetime({ offset: true });

export const adminRoleSchema = z.enum(['STAFF', 'SUPERADMIN']);

export const emptyRequestSchema = z.strictObject({});

export const adminUserSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.string().email(),
  role: adminRoleSchema,
});

export const loginRequestSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    password: z
      .string()
      .min(1)
      .refine((value) => utf8ByteLength(value) <= 72, {
        message: 'Password must be at most 72 UTF-8 bytes',
      }),
  })
  .strict();

export const authResponseSchema = z.object({
  user: adminUserSchema,
  expiresAt: isoDateTimeSchema,
});

export const csrfResponseSchema = z.object({
  csrfToken: z.string().regex(/^[a-f0-9]{64}$/i),
});

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.literal('fa-rent-car-api'),
  time: isoDateTimeSchema,
});

export const apiErrorDetailSchema = z.object({
  path: z.string(),
  message: z.string(),
});

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(apiErrorDetailSchema),
  }),
});

export const MAX_PAGINATION_SKIP = 100_000;

function paginationInteger(maximum: number) {
  const number = z.number().int().min(1).max(maximum);
  return z.union([
    number,
    z
      .string()
      .regex(/^[1-9]\d*$/)
      .pipe(z.coerce.number<string>().pipe(number)),
  ]);
}

export const paginationSchema = z
  .strictObject({
    page: paginationInteger(MAX_PAGINATION_SKIP + 1).default(1),
    limit: paginationInteger(100).default(20),
  })
  .refine(({ page, limit }) => (page - 1) * limit <= MAX_PAGINATION_SKIP, {
    path: ['page'],
    message: 'Pagination offset exceeds the supported range',
  });

export const paginationMetadataSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().min(1).max(100),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  hasPreviousPage: z.boolean(),
  hasNextPage: z.boolean(),
});

export const businessProfileSchema = z.object({
  name: z.string(),
  displayName: z.string(),
  address: z.string(),
  whatsapp: z.string(),
  operatingHours: z.string(),
  timezone: z.literal(TIMEZONE),
  holdMinutes: z.number().int().positive(),
  bufferMinutes: z.number().int().min(0),
});

export const vehicleCategorySchema = z.enum(['MPV', 'SUV', 'CITY_CAR', 'SEDAN', 'VAN']);
export const vehicleTransmissionSchema = z.enum(['MANUAL', 'AUTOMATIC']);
export const vehicleFuelTypeSchema = z.enum(['GASOLINE', 'DIESEL', 'HYBRID', 'ELECTRIC']);
export const vehicleStatusSchema = z.enum([
  'AVAILABLE',
  'RENTED',
  'HELD',
  'MAINTENANCE',
  'INACTIVE',
]);

export const vehicleSummarySchema = z.object({
  id: z.uuid(),
  brand: z.string().nullable(),
  model: z.string().nullable(),
  variant: z.string().nullable(),
  plate: z.string(),
  year: z.number().int(),
  category: vehicleCategorySchema,
  transmission: vehicleTransmissionSchema,
  fuelType: vehicleFuelTypeSchema,
  capacity: z.number().int(),
  luggageCount: z.number().int(),
  mileage: z.number().int(),
  facilities: z.array(z.string()),
  status: vehicleStatusSchema,
  isDemo: z.boolean(),
  dailyRate: z.number().int().nonnegative().nullable(),
});

export const vehicleCountsSchema = z
  .object({
    total: z.number().int().nonnegative(),
    demo: z.number().int().nonnegative(),
    byStatus: z.object({
      AVAILABLE: z.number().int().nonnegative(),
      RENTED: z.number().int().nonnegative(),
      HELD: z.number().int().nonnegative(),
      MAINTENANCE: z.number().int().nonnegative(),
      INACTIVE: z.number().int().nonnegative(),
    }),
  })
  .refine(
    ({ total, demo, byStatus }) =>
      demo <= total && Object.values(byStatus).reduce((sum, count) => sum + count, 0) === total,
  );

export const foundationResponseSchema = z
  .object({
    business: businessProfileSchema,
    vehicles: z.array(vehicleSummarySchema),
    pagination: paginationMetadataSchema,
    vehicleCounts: vehicleCountsSchema,
    phase: z.literal('FOUNDATION'),
    checkedAt: isoDateTimeSchema,
  })
  .refine(
    ({ vehicles, pagination, vehicleCounts }) =>
      vehicles.length <= pagination.limit && pagination.total === vehicleCounts.total,
  );

export const systemResponseSchema = z.object({
  database: z.literal('connected'),
  queue: z.literal('connected'),
  storage: z.literal('connected'),
  checkedAt: isoDateTimeSchema,
});

export const logoutResponseSchema = z.object({
  success: z.literal(true),
});

export type AdminRole = z.infer<typeof adminRoleSchema>;
export type AdminUser = z.infer<typeof adminUserSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type CsrfResponse = z.infer<typeof csrfResponseSchema>;
export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type ApiErrorDetail = z.infer<typeof apiErrorDetailSchema>;
export type ApiErrorResponse = z.infer<typeof apiErrorSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type PaginationMetadata = z.infer<typeof paginationMetadataSchema>;
export type BusinessProfile = z.infer<typeof businessProfileSchema>;
export type VehicleCategory = z.infer<typeof vehicleCategorySchema>;
export type VehicleTransmission = z.infer<typeof vehicleTransmissionSchema>;
export type VehicleFuelType = z.infer<typeof vehicleFuelTypeSchema>;
export type VehicleStatus = z.infer<typeof vehicleStatusSchema>;
export type VehicleSummary = z.infer<typeof vehicleSummarySchema>;
export type VehicleCounts = z.infer<typeof vehicleCountsSchema>;
export type FoundationResponse = z.infer<typeof foundationResponseSchema>;
export type SystemResponse = z.infer<typeof systemResponseSchema>;
export type LogoutResponse = z.infer<typeof logoutResponseSchema>;
