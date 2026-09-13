import { type ReactNode } from 'react';

import { Icon, type IconName } from './Icon';
import { cx } from './lib/cx';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: IconName;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon = 'inbox',
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cx('flex flex-col items-start gap-3 rounded-xl bg-surface-low p-5', className)}>
      <span className="flex size-10 items-center justify-center rounded-xl bg-surface-high text-on-surface-variant">
        <Icon name={icon} size="lg" />
      </span>
      <div>
        <h3 className="text-title text-on-surface">{title}</h3>
        <p className="mt-1 max-w-prose text-body-md text-on-surface-variant">{description}</p>
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
