import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '@fa/db';
import {
  foundationResponseSchema,
  MAX_PAGINATION_SKIP,
  systemResponseSchema,
  type Pagination,
  type VehicleCounts,
} from '@fa/shared';
import { PrismaService } from '../database/prisma.service';
import { JobsService } from '../jobs/jobs.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class FoundationService {
  constructor(
    private readonly database: PrismaService,
    private readonly jobs: JobsService,
    private readonly storage: StorageService,
  ) {}

  async overview({ page, limit }: Pagination) {
    const where = { deletedAt: null };
    const groupedCounts = this.database.vehicle.groupBy({
      by: ['status', 'isDemo'],
      where,
      _count: { _all: true },
    });
    // Keep the page and its totals on one database snapshot.
    const [business, vehicles, groups] = await this.database.$transaction(
      [
        this.database.setting.findUnique({ where: { key: 'business' } }),
        this.database.vehicle.findMany({
          where,
          include: { rate: { select: { daily: true } } },
          orderBy: [{ brand: 'asc' }, { model: 'asc' }, { id: 'asc' }],
          skip: (page - 1) * limit,
          take: limit,
        }),
        groupedCounts,
      ],
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
    if (!business)
      throw new ServiceUnavailableException({
        code: 'SETUP_REQUIRED',
        message: 'Profil usaha belum dikonfigurasi. Jalankan penyiapan data awal.',
      });
    const vehicleCounts: VehicleCounts = {
      total: 0,
      demo: 0,
      byStatus: { AVAILABLE: 0, RENTED: 0, HELD: 0, MAINTENANCE: 0, INACTIVE: 0 },
    };
    for (const group of groups) {
      const count = group._count._all;
      vehicleCounts.total += count;
      vehicleCounts.demo += group.isDemo ? count : 0;
      vehicleCounts.byStatus[group.status] += count;
    }
    return foundationResponseSchema.parse({
      business: business.value,
      phase: 'FOUNDATION',
      checkedAt: new Date().toISOString(),
      pagination: {
        page,
        limit,
        total: vehicleCounts.total,
        totalPages: Math.ceil(vehicleCounts.total / limit),
        hasPreviousPage: page > 1,
        hasNextPage: page * limit < vehicleCounts.total && page * limit <= MAX_PAGINATION_SKIP,
      },
      vehicleCounts,
      vehicles: vehicles.map((vehicle) => ({
        id: vehicle.id,
        brand: vehicle.brand,
        model: vehicle.model,
        variant: vehicle.variant,
        plate: vehicle.plate,
        year: vehicle.year,
        category: vehicle.category,
        transmission: vehicle.transmission,
        fuelType: vehicle.fuelType,
        capacity: vehicle.capacity,
        luggageCount: vehicle.luggageCount,
        mileage: vehicle.mileage,
        facilities: vehicle.facilities,
        status: vehicle.status,
        isDemo: vehicle.isDemo,
        dailyRate: vehicle.rate?.daily ?? null,
      })),
    });
  }

  async dependencies() {
    try {
      await Promise.all([
        this.database.$queryRaw`SELECT 1`,
        this.jobs.check(),
        this.storage.check(),
      ]);
    } catch {
      throw new ServiceUnavailableException({
        code: 'SERVICE_UNAVAILABLE',
        message: 'Salah satu layanan pendukung belum siap. Silakan coba lagi.',
      });
    }
    return systemResponseSchema.parse({
      database: 'connected',
      queue: 'connected',
      storage: 'connected',
      checkedAt: new Date().toISOString(),
    });
  }
}
