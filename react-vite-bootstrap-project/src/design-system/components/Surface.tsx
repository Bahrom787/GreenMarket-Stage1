import { type HTMLAttributes, type ReactNode } from 'react';

type ElevationLevel = 0 | 1 | 2 | 3 | 4;

export interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  tone?: 'base' | 'raised' | 'sunken';
  elevation?: ElevationLevel;
  bordered?: boolean;
}

/** Generic themed container. The building block behind Card and layout surfaces. */
export function Surface({
  children,
  tone = 'raised',
  elevation = 0,
  bordered = false,
  className,
  ...rest
}: SurfaceProps) {
  const classes = [
    'gm-surface',
    `gm-surface--${tone}`,
    elevation > 0 ? `gm-surface--elevation-${elevation}` : '',
    bordered ? 'gm-surface--bordered' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/** Elevated content container used for product cards, summaries, etc. */
export function Card({ children, className, ...rest }: CardProps) {
  return (
    <div className={['gm-card', className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </div>
  );
}

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function Divider({ orientation = 'horizontal', className }: DividerProps) {
  return (
    <hr
      className={[
        'gm-divider',
        orientation === 'vertical' ? 'gm-divider--vertical' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
}
