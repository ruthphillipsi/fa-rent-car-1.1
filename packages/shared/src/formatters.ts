import { TIMEZONE } from './constants';

const currencyFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const wibPartsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TIMEZONE,
  calendar: 'gregory',
  numberingSystem: 'latn',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const indonesianWeekdays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'] as const;
const indonesianMonths = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
] as const;

type WibPart = 'year' | 'month' | 'day' | 'hour' | 'minute';

function normalizeSpaces(value: string): string {
  return value.replace(/[\u00a0\u202f]/g, ' ');
}

function toValidInstant(value: Date | string): Date {
  if (value instanceof Date) {
    const copy = new Date(value.getTime());

    if (Number.isNaN(copy.getTime())) {
      throw new RangeError('Date must be valid');
    }

    return copy;
  }

  if (!/(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)) {
    throw new RangeError('Date strings must include a timezone offset');
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new RangeError('Date must be valid');
  }

  return date;
}

function getWibPart(parts: Intl.DateTimeFormatPart[], type: WibPart): number {
  const part = parts.find((candidate) => candidate.type === type);

  if (part === undefined) {
    throw new RangeError(`Missing ${type} date part`);
  }

  const value = Number(part.value);

  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`Invalid ${type} date part`);
  }

  return value;
}

function weekdayForWibDate(year: number, month: number, day: number): string {
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const label = indonesianWeekdays[weekday];

  if (label === undefined) {
    throw new RangeError('Invalid weekday');
  }

  return label;
}

export function formatRupiah(value: number): string {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError('Rupiah values must be safe integers');
  }

  return normalizeSpaces(currencyFormatter.format(value));
}

export function formatDateTimeWib(value: Date | string): string {
  const date = toValidInstant(value);
  const parts = wibPartsFormatter.formatToParts(date);
  const year = getWibPart(parts, 'year');
  const month = getWibPart(parts, 'month');
  const day = getWibPart(parts, 'day');
  const hour = getWibPart(parts, 'hour');
  const minute = getWibPart(parts, 'minute');
  const monthLabel = indonesianMonths[month - 1];

  if (monthLabel === undefined) {
    throw new RangeError('Invalid month');
  }

  return `${weekdayForWibDate(year, month, day)}, ${String(day).padStart(2, '0')} ${monthLabel} ${year} · ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} WIB`;
}
