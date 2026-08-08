import { type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from 'react';

interface ListItemBaseProps {
  leading?: ReactNode;
  children: ReactNode;
  trailing?: ReactNode;
  selected?: boolean;
  error?: boolean;
}

export interface ListItemProps
  extends ListItemBaseProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Renders as a static (non-interactive) row when true. */
  static?: boolean;
}

/** A single row in a list — interactive by default, or static for display-only rows. */
export function ListItem({
  leading,
  children,
  trailing,
  selected = false,
  error = false,
  static: isStatic = false,
  className,
  disabled,
  ...rest
}: ListItemProps) {
  const classes = [
    'gm-list-item',
    !isStatic ? 'gm-focusable' : '',
    selected ? 'gm-list-item--selected' : '',
    error ? 'gm-list-item--error' : '',
    isStatic ? 'gm-list-item--static' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {leading}
      <span className="gm-list-item__content">{children}</span>
      {trailing && <span className="gm-list-item__trailing">{trailing}</span>}
    </>
  );

  if (isStatic) {
    return (
      <div className={classes} {...(rest as HTMLAttributes<HTMLDivElement>)}>
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      disabled={disabled}
      aria-selected={selected}
      aria-invalid={error || undefined}
      {...rest}
    >
      {content}
    </button>
  );
}
