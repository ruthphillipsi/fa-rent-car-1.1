import { type MouseEventHandler } from 'react';

import { Icon, type IconName } from './Icon';
import { cx } from './lib/cx';

export interface BottomTabItem {
  label: string;
  icon: IconName;
  href?: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

export interface BottomTabBarProps {
  items: ReadonlyArray<BottomTabItem>;
  className?: string;
  ariaLabel?: string;
}

export function BottomTabBar({
  items,
  className,
  ariaLabel = 'Navigasi utama',
}: BottomTabBarProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className={cx(
        'fixed inset-x-0 bottom-0 z-40 border-t border-surface-highest bg-surface-lowest/95 pb-[env(safe-area-inset-bottom)] shadow-bottom-tab backdrop-blur-xl lg:hidden',
        className,
      )}
    >
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-1">
        {items.map((item) => {
          const itemClassName = cx(
            'flex min-h-11 min-w-14 flex-col items-center justify-center gap-0.5 rounded-lg px-2 text-on-surface-variant transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-lowest disabled:cursor-not-allowed disabled:opacity-55',
            item.active ? 'font-semibold text-secondary' : 'hover:text-on-surface',
          );
          const content = (
            <>
              <Icon name={item.icon} size="md" />
              <span className="text-[10px] font-semibold leading-none">{item.label}</span>
            </>
          );

          if (item.href && !item.disabled) {
            return (
              <a
                aria-current={item.active ? 'page' : undefined}
                className={itemClassName}
                href={item.href}
                key={item.label}
              >
                {content}
              </a>
            );
          }

          return (
            <button
              aria-label={item.disabled ? `${item.label} belum tersedia` : item.label}
              className={itemClassName}
              disabled={item.disabled}
              key={item.label}
              onClick={item.onClick}
              type="button"
            >
              {content}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
