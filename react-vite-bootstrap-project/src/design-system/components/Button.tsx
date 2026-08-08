import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader } from '@/design-system/components/Loader';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Marks the button as being in an error/invalid context (e.g. failed retry). */
  error?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

/** Primary call-to-action control. Supports loading, error, and disabled states. */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  error = false,
  leadingIcon,
  trailingIcon,
  className,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      type="button"
      className={[
        'gm-button',
        'gm-focusable',
        `gm-button--${error ? 'danger' : variant}`,
        size !== 'md' ? `gm-button--${size}` : '',
        loading ? 'gm-button--loading' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      aria-invalid={error || undefined}
      {...rest}
    >
      {loading && (
        <span className="gm-button__spinner">
          <Loader />
        </span>
      )}
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  /** Required: IconButtons have no visible label, so they need one for a11y. */
  label: string;
  selected?: boolean;
}

/** Icon-only control (toolbar actions, close buttons, etc). Always labelled. */
export function IconButton({ children, label, selected = false, className, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      className={['gm-icon-button', 'gm-focusable', selected ? 'gm-icon-button--selected' : '', className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
