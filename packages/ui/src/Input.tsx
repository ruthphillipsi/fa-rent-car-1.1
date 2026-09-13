import { forwardRef, useId, type InputHTMLAttributes } from 'react';

import { cx } from './lib/cx';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    id,
    label,
    hint,
    error,
    className,
    containerClassName,
    required,
    'aria-describedby': ariaDescribedBy,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [ariaDescribedBy, hint ? hintId : undefined, error ? errorId : undefined]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cx('space-y-1.5', containerClassName)}>
      {label ? (
        <label
          className="block text-label-md uppercase tracking-[0.06em] text-on-surface-variant"
          htmlFor={inputId}
        >
          {label}
          {required ? (
            <span aria-hidden className="ml-1 text-error">
              *
            </span>
          ) : null}
        </label>
      ) : null}
      <input
        {...props}
        ref={ref}
        aria-describedby={describedBy || undefined}
        aria-invalid={Boolean(error) || undefined}
        className={cx(
          'min-h-11 w-full rounded-lg border bg-surface-low px-3 text-body-md text-on-surface outline-none transition placeholder:text-outline focus:border-secondary focus:bg-surface-lowest focus:ring-2 focus:ring-secondary/20 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none',
          error ? 'border-error focus:border-error focus:ring-error/20' : 'border-surface-highest',
          className,
        )}
        id={inputId}
        required={required}
      />
      {hint && !error ? (
        <p className="text-caption text-on-surface-variant" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="text-caption font-medium text-on-error-container" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
});
