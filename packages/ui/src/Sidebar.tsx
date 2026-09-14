import { type HTMLAttributes, type ReactNode } from 'react';

import { cx } from './lib/cx';

export interface SidebarProps extends HTMLAttributes<HTMLElement> {
  brand: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function Sidebar({ brand, children, footer, className, ...props }: SidebarProps) {
  return (
    <aside
      {...props}
      className={cx(
        'hidden h-dvh w-64 shrink-0 flex-col border-r border-surface-highest bg-surface-lowest lg:fixed lg:inset-y-0 lg:left-0 lg:flex',
        className,
      )}
    >
      <div className="flex h-16 items-center border-b border-surface-highest px-6">{brand}</div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">{children}</div>
      {footer ? <div className="border-t border-surface-highest p-4">{footer}</div> : null}
    </aside>
  );
}
