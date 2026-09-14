import { describe, expect, it } from 'vitest';

import { calculateRentalPrice, type RentalRatePackage } from './index';

const ratePackages: readonly RentalRatePackage[] = [
  { days: 1, amount: 100_000 },
  { days: 7, amount: 600_000 },
  { days: 30, amount: 2_500_000 },
];

describe('calculateRentalPrice', () => {
  it.each([
    [6, 600_000, [{ days: 1, amount: 100_000, quantity: 6 }]],
    [7, 600_000, [{ days: 7, amount: 600_000, quantity: 1 }]],
    [
      8,
      700_000,
      [
        { days: 1, amount: 100_000, quantity: 1 },
        { days: 7, amount: 600_000, quantity: 1 },
      ],
    ],
    [
      29,
      2_500_000,
      [
        { days: 1, amount: 100_000, quantity: 1 },
        { days: 7, amount: 600_000, quantity: 4 },
      ],
    ],
    [30, 2_500_000, [{ days: 30, amount: 2_500_000, quantity: 1 }]],
    [
      31,
      2_600_000,
      [
        { days: 1, amount: 100_000, quantity: 1 },
        { days: 30, amount: 2_500_000, quantity: 1 },
      ],
    ],
  ])(
    'optimizes explicitly supplied packages for %i chargeable days',
    (chargeableDays, vehicleAmount, selectedRatePackages) => {
      const result = calculateRentalPrice({ chargeableDays, ratePackages });

      expect(result.breakdown).toMatchObject({
        selectedRatePackages,
        vehicleAmount,
        driverAmount: 0,
        surchargeAmount: 0,
        subtotal: vehicleAmount,
        promoDiscount: 0,
        total: vehicleAmount,
      });
    },
  );

  it('adds explicitly supplied driver and per-day charges before flooring a basis-points promo', () => {
    const result = calculateRentalPrice({
      chargeableDays: 8,
      ratePackages,
      driverPerDay: 50_000,
      dailySurcharges: [0, 10_000, 0, 20_000, 0, 0, 0, 5_000],
      promo: { type: 'basisPoints', basisPoints: 1_250 },
    });

    expect(result.breakdown).toEqual({
      selectedRatePackages: [
        { days: 1, amount: 100_000, quantity: 1 },
        { days: 7, amount: 600_000, quantity: 1 },
      ],
      vehicleAmount: 700_000,
      driverAmount: 400_000,
      surchargeAmount: 35_000,
      subtotal: 1_135_000,
      promoDiscount: 141_875,
      total: 993_125,
    });
  });

  it('clamps fixed and basis-points promos to the subtotal', () => {
    const input = { chargeableDays: 1, ratePackages: [{ days: 1, amount: 999 }] };

    expect(
      calculateRentalPrice({ ...input, promo: { type: 'fixed', amount: 2_000 } }).breakdown,
    ).toMatchObject({
      subtotal: 999,
      promoDiscount: 999,
      total: 0,
    });
    expect(
      calculateRentalPrice({ ...input, promo: { type: 'basisPoints', basisPoints: 20_000 } })
        .breakdown,
    ).toMatchObject({ subtotal: 999, promoDiscount: 999, total: 0 });
  });

  it('returns independent snapshots without mutating inputs', () => {
    const input = {
      chargeableDays: 7,
      ratePackages: [
        { days: 1, amount: 100_000 },
        { days: 7, amount: 650_000 },
      ],
      driverPerDay: 20_000,
      dailySurcharges: [0, 0, 0, 0, 0, 0, 10_000],
      promo: { type: 'fixed' as const, amount: 25_000 },
    };
    const before = structuredClone(input);

    const result = calculateRentalPrice(input);

    expect(input).toEqual(before);
    expect(result.snapshot).toEqual({ ...before, promo: { type: 'fixed', amount: 25_000 } });

    input.ratePackages[0]!.amount = 1;
    input.dailySurcharges[6] = 1;
    input.promo.amount = 1;
    expect(result.snapshot).toEqual({ ...before, promo: { type: 'fixed', amount: 25_000 } });
  });

  it('rejects unsafe, negative, partial, and uncovered policy inputs', () => {
    const valid = { chargeableDays: 1, ratePackages: [{ days: 1, amount: 100 }] };

    for (const input of [
      { ...valid, chargeableDays: 0 },
      { ...valid, chargeableDays: -1 },
      { ...valid, chargeableDays: 1.5 },
      { ...valid, chargeableDays: Number.MAX_SAFE_INTEGER + 1 },
      { ...valid, ratePackages: [{ days: 1, amount: -1 }] },
      { ...valid, ratePackages: [{ days: 0, amount: 100 }] },
      { ...valid, ratePackages: [{ days: 1, amount: Number.MAX_SAFE_INTEGER + 1 }] },
      { ...valid, driverPerDay: -1 },
      { ...valid, driverPerDay: Number.MAX_SAFE_INTEGER + 1 },
      { ...valid, dailySurcharges: [-1] },
      { ...valid, dailySurcharges: [Number.MAX_SAFE_INTEGER + 1] },
      { ...valid, dailySurcharges: [0, 0] },
      { ...valid, promo: { type: 'fixed' as const, amount: -1 } },
      { ...valid, promo: { type: 'fixed' as const, amount: Number.MAX_SAFE_INTEGER + 1 } },
      { ...valid, promo: { type: 'basisPoints' as const, basisPoints: -1 } },
      {
        ...valid,
        promo: { type: 'basisPoints' as const, basisPoints: Number.MAX_SAFE_INTEGER + 1 },
      },
      { chargeableDays: 8, ratePackages: [{ days: 7, amount: 600_000 }] },
    ]) {
      expect(() => calculateRentalPrice(input)).toThrow(RangeError);
    }
  });

  it('ignores an unsafe expensive candidate when a cheaper safe combination exists', () => {
    const result = calculateRentalPrice({
      chargeableDays: 2,
      ratePackages: [
        { days: 1, amount: Number.MAX_SAFE_INTEGER },
        { days: 2, amount: 100 },
      ],
    });
    expect(result.breakdown.total).toBe(100);
  });

  it('rejects missing daily surcharges instead of treating array holes as zero', () => {
    const dailySurcharges = new Array<number>(2);
    dailySurcharges[1] = 50_000;

    expect(() =>
      calculateRentalPrice({ chargeableDays: 2, ratePackages, dailySurcharges }),
    ).toThrow('dailySurcharges[0] must be a non-negative safe integer');
  });

  it('rejects missing rate packages during validation', () => {
    const sparsePackages = new Array<RentalRatePackage>(2);
    sparsePackages[1] = { days: 1, amount: 100_000 };

    expect(() => calculateRentalPrice({ chargeableDays: 1, ratePackages: sparsePackages })).toThrow(
      'ratePackages[0] must be an object',
    );
  });

  it('rejects the optimal total when it cannot be represented safely', () => {
    expect(() =>
      calculateRentalPrice({
        chargeableDays: 2,
        ratePackages: [{ days: 1, amount: Number.MAX_SAFE_INTEGER }],
      }),
    ).toThrow(RangeError);
  });
});
