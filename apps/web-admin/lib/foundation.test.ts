import { describe, expect, it } from 'vitest';

import type { VehicleSummary } from '@fa/shared';

import { countVehiclesByStatus, vehicleDetail, vehicleName } from './foundation';

const vehicle: VehicleSummary = {
  id: 'c4f5c3d4-f1f5-4a45-a815-1671afbd70e1',
  brand: 'Toyota',
  model: 'Avanza',
  variant: null,
  plate: 'E 1234 FA',
  year: 2024,
  category: 'MPV',
  transmission: 'AUTOMATIC',
  fuelType: 'GASOLINE',
  capacity: 7,
  luggageCount: 2,
  mileage: 100,
  facilities: [],
  status: 'AVAILABLE',
  isDemo: true,
  dailyRate: 500000,
};

describe('foundation presentation helpers', () => {
  it('shows a safe fallback when the API has no vehicle name', () => {
    expect(vehicleName({ ...vehicle, brand: null, model: null })).toBe('Nama mobil belum tersedia');
    expect(vehicleDetail(vehicle)).toBe('2024 · MPV');
  });

  it('counts only the requested live fleet status', () => {
    expect(
      countVehiclesByStatus(
        [vehicle, { ...vehicle, id: 'cf5aa124-51e5-451c-9087-d5104aa979a3', status: 'RENTED' }],
        'AVAILABLE',
      ),
    ).toBe(1);
  });
});
