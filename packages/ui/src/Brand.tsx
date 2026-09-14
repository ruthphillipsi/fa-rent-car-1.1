import { cx } from './lib/cx';

export interface BrandProps {
  compact?: boolean;
  subtitle?: string;
  className?: string;
}

export function Brand({ compact = false, subtitle = 'Sewa mobil Cirebon', className }: BrandProps) {
  return (
    <div className={cx('flex min-w-0 items-center gap-3', className)}>
      <span
        role={compact ? 'img' : undefined}
        aria-hidden={!compact}
        aria-label={compact ? 'FA RENT CAR' : undefined}
        className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-title font-bold text-surface-lowest"
      >
        FA
      </span>
      {!compact ? (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[15px] font-bold leading-none tracking-tight text-on-surface">
            FA RENT CAR
          </span>
          <span className="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary">
            {subtitle}
          </span>
        </span>
      ) : null}
    </div>
  );
}
