import bcrypt from 'bcrypt';
import { Prisma, PrismaClient } from '@prisma/client';

import {
  BCRYPT_COST,
  BUSINESS_SETTING_VALUE,
  readSeedConfig,
  SeedConfigError,
} from './seed-config';

const demoDescription =
  'Data demonstrasi sintetis; bukan kendaraan nyata dan tidak tersedia untuk disewa.';

const demoVehicles: Prisma.VehicleCreateInput[] = [
  {
    brand: 'FA Demo',
    model: 'MPV Satu',
    variant: 'Synthetic',
    year: 2026,
    plate: 'DEMO-FA-001',
    color: 'Demo Silver',
    transmission: 'MANUAL',
    category: 'MPV',
    fuelType: 'GASOLINE',
    capacity: 7,
    luggageCount: 2,
    mileage: 0,
    facilities: [],
    description: demoDescription,
    status: 'INACTIVE',
    isDemo: true,
    rate: {
      create: {
        daily: 350_000,
        weekly: 2_100_000,
        monthly: 7_500_000,
        driverPerDay: 150_000,
        overtimeHourly: 50_000,
        latePerDay: 350_000,
      },
    },
  },
  {
    brand: 'FA Demo',
    model: 'SUV Dua',
    variant: 'Synthetic',
    year: 2026,
    plate: 'DEMO-FA-002',
    color: 'Demo Black',
    transmission: 'AUTOMATIC',
    category: 'SUV',
    fuelType: 'GASOLINE',
    capacity: 5,
    luggageCount: 3,
    mileage: 0,
    facilities: [],
    description: demoDescription,
    status: 'INACTIVE',
    isDemo: true,
    rate: {
      create: {
        daily: 450_000,
        weekly: 2_700_000,
        monthly: 9_600_000,
        driverPerDay: 175_000,
        overtimeHourly: 60_000,
        latePerDay: 450_000,
      },
    },
  },
  {
    brand: 'FA Demo',
    model: 'City Tiga',
    variant: 'Synthetic',
    year: 2026,
    plate: 'DEMO-FA-003',
    color: 'Demo White',
    transmission: 'AUTOMATIC',
    category: 'CITY_CAR',
    fuelType: 'ELECTRIC',
    capacity: 4,
    luggageCount: 1,
    mileage: 0,
    facilities: [],
    description: demoDescription,
    status: 'INACTIVE',
    isDemo: true,
    rate: {
      create: {
        daily: 300_000,
        weekly: 1_800_000,
        monthly: 6_500_000,
        driverPerDay: 125_000,
        overtimeHourly: 45_000,
        latePerDay: 300_000,
      },
    },
  },
  {
    brand: 'FA Demo',
    model: 'Sedan Empat',
    variant: 'Synthetic',
    year: 2026,
    plate: 'DEMO-FA-004',
    color: 'Demo Blue',
    transmission: 'MANUAL',
    category: 'SEDAN',
    fuelType: 'HYBRID',
    capacity: 5,
    luggageCount: 2,
    mileage: 0,
    facilities: [],
    description: demoDescription,
    status: 'INACTIVE',
    isDemo: true,
    rate: {
      create: {
        daily: 400_000,
        weekly: 2_400_000,
        monthly: 8_600_000,
        driverPerDay: 160_000,
        overtimeHourly: 55_000,
        latePerDay: 400_000,
      },
    },
  },
  {
    brand: 'FA Demo',
    model: 'Van Lima',
    variant: 'Synthetic',
    year: 2026,
    plate: 'DEMO-FA-005',
    color: 'Demo Grey',
    transmission: 'MANUAL',
    category: 'VAN',
    fuelType: 'DIESEL',
    capacity: 8,
    luggageCount: 4,
    mileage: 0,
    facilities: [],
    description: demoDescription,
    status: 'INACTIVE',
    isDemo: true,
    rate: {
      create: {
        daily: 500_000,
        weekly: 3_000_000,
        monthly: 10_800_000,
        driverPerDay: 200_000,
        overtimeHourly: 65_000,
        latePerDay: 500_000,
      },
    },
  },
];

async function ensureAdmin(prisma: PrismaClient, email: string, password: string): Promise<void> {
  const existingAdmin = await prisma.adminUser.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingAdmin) {
    return;
  }

  await prisma.adminUser.create({
    data: {
      name: 'Initial Superadmin',
      email,
      passwordHash: await bcrypt.hash(password, BCRYPT_COST),
      role: 'SUPERADMIN',
    },
  });
}

async function ensureBusinessSetting(prisma: PrismaClient): Promise<void> {
  const existingSetting = await prisma.setting.findUnique({
    where: { key: 'business' },
    select: { key: true },
  });

  if (!existingSetting) {
    await prisma.setting.create({
      data: { key: 'business', value: BUSINESS_SETTING_VALUE },
    });
  }
}

async function ensureDemoVehicles(prisma: PrismaClient): Promise<void> {
  for (const vehicle of demoVehicles) {
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { plate: vehicle.plate },
      select: { id: true },
    });

    if (!existingVehicle) {
      await prisma.vehicle.create({ data: vehicle });
    }
  }
}

export async function runSeed(): Promise<void> {
  const config = readSeedConfig();
  const prisma = new PrismaClient();

  try {
    await ensureAdmin(prisma, config.adminEmail, config.adminPassword);
    await ensureBusinessSetting(prisma);

    if (config.seedDemoData) {
      await ensureDemoVehicles(prisma);
    }
  } finally {
    await prisma.$disconnect();
  }
}

export function formatSeedError(error: unknown): string {
  if (error instanceof SeedConfigError) {
    return error.message;
  }

  return 'Database seed failed. Review database connectivity and non-sensitive configuration.';
}
