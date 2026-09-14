import type { BadgeTone, IconName } from '@fa/ui';
import type { VehicleStatus, VehicleSummary } from '@fa/shared';

export const vehicleStatusMeta: Record<
  VehicleStatus,
  { label: string; tone: BadgeTone; icon: IconName }
> = {
  AVAILABLE: { label: 'Siap sewa', tone: 'info', icon: 'directions_car' },
  RENTED: { label: 'Sedang disewa', tone: 'success', icon: 'key' },
  HELD: { label: 'Ditahan', tone: 'warning', icon: 'hourglass_top' },
  MAINTENANCE: { label: 'Perawatan', tone: 'neutral', icon: 'build' },
  INACTIVE: { label: 'Nonaktif', tone: 'neutral', icon: 'block' },
};

export function vehicleName(vehicle: VehicleSummary): string {
  const name = [vehicle.brand, vehicle.model]
    .filter((part): part is string => Boolean(part))
    .join(' ');

  return name || 'Nama mobil belum tersedia';
}

export function vehicleDetail(vehicle: VehicleSummary): string {
  return vehicle.variant || `${vehicle.year} · ${vehicle.category.replace('_', ' ')}`;
}

export function countVehiclesByStatus(
  vehicles: ReadonlyArray<VehicleSummary>,
  status: VehicleStatus,
): number {
  return vehicles.filter((vehicle) => vehicle.status === status).length;
}
