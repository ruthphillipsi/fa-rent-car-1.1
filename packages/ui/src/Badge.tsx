import { type ReactNode } from 'react';

import { cx } from './lib/cx';

export type BadgeTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

export interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
}

const toneClasses: Record<BadgeTone, string> = {
  info: 'bg-secondary-fixed text-on-secondary-fixed-variant',
  success: 'bg-success-container text-on-success-container',
  warning: 'bg-warning-container text-on-warning-container',
  danger: 'bg-error-container text-on-error-container',
  neutral: 'bg-surface text-on-surface-variant',
};

const dotClasses: Record<BadgeTone, string> = {
  info: 'bg-secondary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-error',
  neutral: 'bg-outline',
};

export function Badge({ children, tone = 'neutral', dot = false, className }: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex min-h-6 items-center gap-1.5 rounded-full px-2.5 py-1 text-label-md uppercase tracking-[0.02em]',
        toneClasses[tone],
        className,
      )}
    >
      {dot ? <span aria-hidden className={cx('size-1.5 rounded-full', dotClasses[tone])} /> : null}
      {children}
    </span>
  );
}
