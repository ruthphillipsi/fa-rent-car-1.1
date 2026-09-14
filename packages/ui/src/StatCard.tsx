import { type ReactNode } from 'react';

import { Icon, type IconName } from './Icon';
import { Card } from './Card';
import { cx } from './lib/cx';

export interface StatCardProps {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  icon?: IconName;
  tone?: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
  className?: string;
}

const iconToneClasses: Record<NonNullable<StatCardProps['tone']>, string> = {
  info: 'bg-secondary-fixed text-on-secondary-fixed-variant',
  success: 'bg-success-container text-on-success-container',
  warning: 'bg-warning-container text-on-warning-container',
  danger: 'bg-error-container text-on-error-container',
  neutral: 'bg-surface text-on-surface-variant',
};

export function StatCard({ label, value, detail, icon, tone = 'info', className }: StatCardProps) {
  return (
    <Card className={cx('flex min-h-40 flex-col justify-between', className)} padding="md">
      <div className="flex items-start justify-between gap-3">
        <p className="max-w-[12rem] text-label-md uppercase tracking-[0.06em] text-on-surface-variant">
          {label}
        </p>
        {icon ? (
          <span
            className={cx(
              'flex size-9 shrink-0 items-center justify-center rounded-xl',
              iconToneClasses[tone],
            )}
          >
            <Icon name={icon} size="md" />
          </span>
        ) : null}
      </div>
      <div className="mt-5">
        <p className="tabular-nums text-stat tracking-[-0.02em] text-on-surface">{value}</p>
        {detail ? <div className="mt-1 text-body-md text-on-surface-variant">{detail}</div> : null}
      </div>
    </Card>
  );
}
