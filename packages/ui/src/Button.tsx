import {
  forwardRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';

import { Icon, type IconName } from './Icon';
import { cx } from './lib/cx';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'tinted'
  | 'destructive'
  | 'whatsapp';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconPosition?: 'start' | 'end';
  loading?: boolean;
  children: ReactNode;
}

export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconPosition?: 'start' | 'end';
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-surface-lowest hover:bg-primary-container focus-visible:ring-primary',
  secondary:
    'bg-secondary text-surface-lowest shadow-action hover:bg-secondary-container focus-visible:ring-secondary',
  outline:
    'border border-surface-highest bg-surface-lowest text-on-surface hover:bg-surface-low focus-visible:ring-secondary',
  tinted:
    'bg-secondary-fixed text-on-secondary-fixed-variant hover:bg-secondary-fixed/80 focus-visible:ring-secondary',
  destructive:
    'bg-error-container text-on-error-container hover:bg-error-container/80 focus-visible:ring-error',
  whatsapp: 'bg-whatsapp text-surface-lowest hover:brightness-105 focus-visible:ring-whatsapp',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-xs',
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-[3.25rem] px-6 text-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    icon,
    iconPosition = 'start',
    loading = false,
    className,
    children,
    disabled,
    type = 'button',
    ...props
  },
  ref,
) {
  const isDisabled = disabled || loading;
  const iconSize = size === 'sm' ? 'sm' : 'md';
  const renderedIcon = icon ? <Icon name={icon} size={iconSize} /> : null;

  return (
    <button
      {...props}
      ref={ref}
      aria-busy={loading || undefined}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-button font-semibold transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transition-none',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      disabled={isDisabled}
      type={type}
    >
      {loading ? (
        <Icon
          className="animate-spin motion-reduce:animate-none"
          name="progress_activity"
          size={iconSize}
        />
      ) : null}
      {!loading && iconPosition === 'start' ? renderedIcon : null}
      <span>{children}</span>
      {!loading && iconPosition === 'end' ? renderedIcon : null}
    </button>
  );
});

export const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(function ButtonLink(
  { variant = 'primary', size = 'md', icon, iconPosition = 'start', className, children, ...props },
  ref,
) {
  const iconSize = size === 'sm' ? 'sm' : 'md';
  const renderedIcon = icon ? <Icon name={icon} size={iconSize} /> : null;

  return (
    <a
      {...props}
      ref={ref}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-button font-semibold transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {iconPosition === 'start' ? renderedIcon : null}
      <span>{children}</span>
      {iconPosition === 'end' ? renderedIcon : null}
    </a>
  );
});
