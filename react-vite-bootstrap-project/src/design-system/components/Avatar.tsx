import { type ButtonHTMLAttributes, type ReactNode } from 'react';

export interface AvatarProps {
  size?: 'sm' | 'md' | 'lg';
  src?: string;
  alt?: string;
  initials?: string;
  className?: string;
}

/** Circular identity marker. Falls back to initials when no image is given. */
export function Avatar({ size = 'md', src, alt = '', initials, className }: AvatarProps) {
  return (
    <span className={['gm-avatar', `gm-avatar--${size}`, className].filter(Boolean).join(' ')}>
      {src ? <img src={src} alt={alt} /> : <span aria-hidden={alt ? undefined : true}>{initials}</span>}
    </span>
  );
}

export interface BadgeProps {
  children?: ReactNode;
  tone?: 'danger' | 'neutral' | 'success';
  dot?: boolean;
  label?: string;
  className?: string;
}

/** Small numeric/status marker, typically anchored to another element. */
export function Badge({ children, tone = 'danger', dot = false, label, className }: BadgeProps) {
  return (
    <span
      className={[
        'gm-badge',
        tone !== 'danger' ? `gm-badge--${tone}` : '',
        dot ? 'gm-badge--dot' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      role={label ? 'status' : undefined}
      aria-label={label}
    >
      {!dot ? children : null}
    </span>
  );
}

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  selected?: boolean;
  error?: boolean;
}

/** Toggleable filter/selection control. */
export function Chip({ children, selected = false, error = false, className, disabled, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      className={[
        'gm-chip',
        'gm-focusable',
        selected ? 'gm-chip--selected' : '',
        error ? 'gm-chip--error' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-pressed={selected}
      aria-invalid={error || undefined}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
