import { type HTMLAttributes, type ReactNode } from 'react';

import { cx } from './lib/cx';

export interface TopbarProps extends HTMLAttributes<HTMLElement> {
  mobileBrand?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
}

export function Topbar({ mobileBrand, children, actions, className, ...props }: TopbarProps) {
  return (
    <header
      {...props}
      className={cx(
        'sticky top-0 z-30 flex min-h-16 items-center justify-between gap-4 border-b border-surface-highest bg-surface-lowest/85 px-5 shadow-topbar backdrop-blur-xl lg:px-8',
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-4">
        {mobileBrand ? <div className="lg:hidden">{mobileBrand}</div> : null}
        {children ? <div className="min-w-0">{children}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
