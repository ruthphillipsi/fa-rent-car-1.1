import { cx } from './lib/cx';

export type IconName = string;

export interface IconProps {
  name: IconName;
  label?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  filled?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-[2.5rem]',
} as const;

export function Icon({ name, label, size = 'md', filled = false, className }: IconProps) {
  return (
    <span
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={cx(
        'material-symbols-outlined inline-flex shrink-0 leading-none',
        sizeClasses[size],
        className,
      )}
      role={label ? 'img' : undefined}
      style={
        filled ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" } : undefined
      }
    >
      {name}
    </span>
  );
}
