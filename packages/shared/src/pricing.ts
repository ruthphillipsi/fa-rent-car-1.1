const BASIS_POINTS_DIVISOR = 10_000n;
const MAX_OPTIMIZER_DAYS = 100_000;

export interface RentalRatePackage {
  readonly days: number;
  readonly amount: number;
}

export type RentalPricePromo =
  | Readonly<{
      type: 'fixed';
      amount: number;
    }>
  | Readonly<{
      type: 'basisPoints';
      basisPoints: number;
    }>;

export interface CalculateRentalPriceInput {
  readonly chargeableDays: number;
  readonly ratePackages: readonly RentalRatePackage[];
  readonly driverPerDay?: number;
  readonly dailySurcharges?: readonly number[];
  readonly promo?: RentalPricePromo;
}

export interface SelectedRatePackage extends RentalRatePackage {
  readonly quantity: number;
}

export interface RentalPriceBreakdown {
  readonly selectedRatePackages: readonly SelectedRatePackage[];
  readonly vehicleAmount: number;
  readonly driverAmount: number;
  readonly surchargeAmount: number;
  readonly subtotal: number;
  readonly promoDiscount: number;
  readonly total: number;
}

export interface RentalPriceSnapshot {
  readonly chargeableDays: number;
  readonly ratePackages: readonly RentalRatePackage[];
  readonly driverPerDay: number;
  readonly dailySurcharges: readonly number[];
  readonly promo: RentalPricePromo | null;
}

export interface RentalPriceResult {
  readonly breakdown: RentalPriceBreakdown;
  readonly snapshot: RentalPriceSnapshot;
}

interface OptimizerState {
  readonly amount: bigint;
  readonly packageCount: number;
  readonly packageIndex: number;
  readonly previousDay: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function assertPositiveSafeInteger(value: unknown, name: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive safe integer`);
  }
}

function assertNonNegativeSafeInteger(value: unknown, name: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative safe integer`);
  }
}

function addMoney(left: number, right: number, name: string): number {
  const total = left + right;

  if (!Number.isSafeInteger(total)) {
    throw new RangeError(`${name} exceeds the safe integer range`);
  }

  return total;
}

function multiplyMoney(left: number, right: number, name: string): number {
  if (left !== 0 && right > Math.floor(Number.MAX_SAFE_INTEGER / left)) {
    throw new RangeError(`${name} exceeds the safe integer range`);
  }

  return left * right;
}

function clonePromo(promo: RentalPricePromo | null): RentalPricePromo | null {
  if (promo === null) {
    return null;
  }

  return promo.type === 'fixed'
    ? { type: 'fixed', amount: promo.amount }
    : { type: 'basisPoints', basisPoints: promo.basisPoints };
}

function validatePromo(promo: RentalPricePromo | undefined): RentalPricePromo | null {
  if (promo === undefined) {
    return null;
  }

  if (!isRecord(promo)) {
    throw new TypeError('promo must be an object');
  }

  if (promo.type === 'fixed') {
    assertNonNegativeSafeInteger(promo.amount, 'promo.amount');
    return { type: 'fixed', amount: promo.amount };
  }

  if (promo.type === 'basisPoints') {
    assertNonNegativeSafeInteger(promo.basisPoints, 'promo.basisPoints');
    return { type: 'basisPoints', basisPoints: promo.basisPoints };
  }

  throw new RangeError('promo.type must be fixed or basisPoints');
}

function calculatePromoDiscount(subtotal: number, promo: RentalPricePromo | null): number {
  if (promo === null) {
    return 0;
  }

  if (promo.type === 'fixed') {
    return Math.min(promo.amount, subtotal);
  }

  const rawDiscount = (BigInt(subtotal) * BigInt(promo.basisPoints)) / BASIS_POINTS_DIVISOR;
  const cappedDiscount = rawDiscount > BigInt(subtotal) ? BigInt(subtotal) : rawDiscount;

  return Number(cappedDiscount);
}

function isBetterCandidate(
  candidate: OptimizerState,
  current: OptimizerState | undefined,
): boolean {
  if (current === undefined || candidate.amount !== current.amount) {
    return current === undefined || candidate.amount < current.amount;
  }

  if (candidate.packageCount !== current.packageCount) {
    return candidate.packageCount < current.packageCount;
  }

  return candidate.packageIndex < current.packageIndex;
}

function selectRatePackages(
  chargeableDays: number,
  ratePackages: readonly RentalRatePackage[],
): { amount: number; packages: SelectedRatePackage[] } {
  const best: Array<OptimizerState | undefined> = new Array(chargeableDays + 1);
  best[0] = { amount: 0n, packageCount: 0, packageIndex: -1, previousDay: -1 };

  for (let currentDay = 1; currentDay <= chargeableDays; currentDay += 1) {
    for (const [packageIndex, ratePackage] of ratePackages.entries()) {
      if (ratePackage.days > currentDay) {
        continue;
      }

      const previousDay = currentDay - ratePackage.days;
      const previous = best[previousDay];

      if (previous === undefined) {
        continue;
      }

      const candidate: OptimizerState = {
        amount: previous.amount + BigInt(ratePackage.amount),
        packageCount: previous.packageCount + 1,
        packageIndex,
        previousDay,
      };

      if (isBetterCandidate(candidate, best[currentDay])) {
        best[currentDay] = candidate;
      }
    }
  }

  const selected = best[chargeableDays];

  if (selected === undefined) {
    throw new RangeError('ratePackages cannot cover chargeableDays exactly');
  }
  if (selected.amount > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError('vehicle amount exceeds the safe integer range');
  }

  const quantities = new Map<number, number>();
  let currentDay = chargeableDays;

  while (currentDay > 0) {
    const state = best[currentDay];

    if (state === undefined || state.packageIndex < 0) {
      throw new RangeError('ratePackages cannot cover chargeableDays exactly');
    }

    quantities.set(state.packageIndex, (quantities.get(state.packageIndex) ?? 0) + 1);
    currentDay = state.previousDay;
  }

  const packages = [...quantities.entries()]
    .sort(([firstIndex], [secondIndex]) => firstIndex - secondIndex)
    .map(([packageIndex, quantity]) => {
      const ratePackage = ratePackages[packageIndex];

      if (ratePackage === undefined) {
        throw new RangeError('Selected rate package is unavailable');
      }

      return { ...ratePackage, quantity };
    });

  return { amount: Number(selected.amount), packages };
}

/**
 * Optimizes explicitly supplied rate packages only. It is not booking-pricing policy,
 * and the API must still validate policy and persist invoice snapshots when it is wired.
 */
export function calculateRentalPrice(input: CalculateRentalPriceInput): RentalPriceResult {
  const rawInput: unknown = input;

  if (!isRecord(rawInput)) {
    throw new TypeError('input must be an object');
  }

  const { chargeableDays, ratePackages } = input;
  assertPositiveSafeInteger(chargeableDays, 'chargeableDays');

  if (chargeableDays > MAX_OPTIMIZER_DAYS) {
    throw new RangeError(`chargeableDays must not exceed ${MAX_OPTIMIZER_DAYS}`);
  }

  if (!Array.isArray(ratePackages) || ratePackages.length === 0) {
    throw new RangeError('ratePackages must contain at least one package');
  }

  const validatedRatePackages = Array.from(ratePackages, (ratePackage, index) => {
    if (!isRecord(ratePackage)) {
      throw new TypeError(`ratePackages[${index}] must be an object`);
    }

    assertPositiveSafeInteger(ratePackage.days, `ratePackages[${index}].days`);
    assertNonNegativeSafeInteger(ratePackage.amount, `ratePackages[${index}].amount`);

    return { days: ratePackage.days, amount: ratePackage.amount };
  });

  const driverPerDay = input.driverPerDay === undefined ? 0 : input.driverPerDay;
  assertNonNegativeSafeInteger(driverPerDay, 'driverPerDay');

  const dailySurcharges = input.dailySurcharges === undefined ? [] : input.dailySurcharges;

  if (!Array.isArray(dailySurcharges)) {
    throw new TypeError('dailySurcharges must be an array');
  }

  if (dailySurcharges.length !== 0 && dailySurcharges.length !== chargeableDays) {
    throw new RangeError('dailySurcharges must have one value for each chargeable day');
  }

  const validatedDailySurcharges = Array.from(dailySurcharges, (surcharge, index) => {
    assertNonNegativeSafeInteger(surcharge, `dailySurcharges[${index}]`);
    return surcharge;
  });
  const promo = validatePromo(input.promo);
  const vehicle = selectRatePackages(chargeableDays, validatedRatePackages);
  const driverAmount = multiplyMoney(driverPerDay, chargeableDays, 'driver amount');
  const surchargeAmount = validatedDailySurcharges.reduce(
    (total, surcharge) => addMoney(total, surcharge, 'surcharge amount'),
    0,
  );
  const subtotal = addMoney(
    addMoney(vehicle.amount, driverAmount, 'subtotal'),
    surchargeAmount,
    'subtotal',
  );
  const promoDiscount = calculatePromoDiscount(subtotal, promo);

  return {
    breakdown: {
      selectedRatePackages: vehicle.packages,
      vehicleAmount: vehicle.amount,
      driverAmount,
      surchargeAmount,
      subtotal,
      promoDiscount,
      total: subtotal - promoDiscount,
    },
    snapshot: {
      chargeableDays,
      ratePackages: validatedRatePackages.map((ratePackage) => ({ ...ratePackage })),
      driverPerDay,
      dailySurcharges: [...validatedDailySurcharges],
      promo: clonePromo(promo),
    },
  };
}
