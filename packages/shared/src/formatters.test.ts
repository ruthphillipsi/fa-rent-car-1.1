import { describe, expect, it } from 'vitest';

import { formatDateTimeWib, formatRupiah } from './index';

describe('formatRupiah', () => {
  it('formats integer rupiah using ordinary spaces', () => {
    const formatted = formatRupiah(1_234_567);

    expect(formatted).toBe('Rp 1.234.567');
    expect(formatted).not.toMatch(/[\u00a0\u202f]/);
  });

  it('rejects unsafe or fractional money values', () => {
    expect(() => formatRupiah(12.5)).toThrow(RangeError);
    expect(() => formatRupiah(Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
    expect(() => formatRupiah(Number.NaN)).toThrow(RangeError);
  });
});

describe('formatDateTimeWib', () => {
  it('uses Jakarta time and the stable Indonesian display convention', () => {
    expect(formatDateTimeWib('2026-09-15T02:00:00.000Z')).toBe('Sel, 15 Sep 2026 · 09:00 WIB');
    expect(formatDateTimeWib(new Date('2026-09-14T17:00:00.000Z'))).toBe(
      'Sel, 15 Sep 2026 · 00:00 WIB',
    );
  });

  it('uses fixed Indonesian abbreviations rather than the host locale', () => {
    expect(formatDateTimeWib('2026-01-03T17:00:00.000Z')).toBe('Min, 04 Jan 2026 · 00:00 WIB');
    expect(formatDateTimeWib('2026-10-31T17:00:00.000Z')).toBe('Min, 01 Nov 2026 · 00:00 WIB');
  });

  it('requires an unambiguous instant rather than the server local timezone', () => {
    expect(() => formatDateTimeWib('2026-09-15T09:00:00')).toThrow(RangeError);
    expect(() => formatDateTimeWib(new Date('not a date'))).toThrow(RangeError);
  });
});
