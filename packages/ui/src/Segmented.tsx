'use client';

import { type ReactNode } from 'react';

import { cx } from './lib/cx';

export interface SegmentedOption<T extends string> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
}

export interface SegmentedProps<T extends string> {
  value: T;
  options: ReadonlyArray<SegmentedOption<T>>;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  className,
}: SegmentedProps<T>) {
  return (
    <div
      aria-label={ariaLabel}
      className={cx('flex rounded-xl bg-surface-low p-1', className)}
      role="group"
    >
      {options.map((option) => {
        const isSelected = option.value === value;

        return (
          <button
            key={option.value}
            aria-pressed={isSelected}
            className={cx(
              'min-h-9 flex-1 rounded-lg px-3 text-label-md transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-low disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none',
              isSelected
                ? 'bg-surface-lowest text-on-surface shadow-card'
                : 'text-on-surface-variant hover:text-on-surface',
            )}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
