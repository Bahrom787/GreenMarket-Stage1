import { type HTMLAttributes, type ReactNode } from 'react';
import { spacing } from '@/design-system/tokens/scales';

type SpaceKey = keyof typeof spacing;
type Align = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
type Justify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';

const alignMap: Record<Align, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  baseline: 'baseline',
};
const justifyMap: Record<Justify, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
};

interface FlexLayoutProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Gap between children, expressed as a spacing token key. */
  gap?: SpaceKey;
  align?: Align;
  justify?: Justify;
  wrap?: boolean;
}

/** Horizontal flex layout. */
export function Row({ children, gap = 'none', align, justify, wrap, className, style, ...rest }: FlexLayoutProps) {
  return (
    <div
      className={['gm-row', className].filter(Boolean).join(' ')}
      style={{
        gap: spacing[gap],
        alignItems: align ? alignMap[align] : undefined,
        justifyContent: justify ? justifyMap[justify] : undefined,
        flexWrap: wrap ? 'wrap' : undefined,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Vertical flex layout. */
export function Column({ children, gap = 'none', align, justify, wrap, className, style, ...rest }: FlexLayoutProps) {
  return (
    <div
      className={['gm-column', className].filter(Boolean).join(' ')}
      style={{
        gap: spacing[gap],
        alignItems: align ? alignMap[align] : undefined,
        justifyContent: justify ? justifyMap[justify] : undefined,
        flexWrap: wrap ? 'wrap' : undefined,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

/** Vertical layout with consistent spacing between items — an opinionated Column. */
export function Stack({ children, gap = 'md', className, style, ...rest }: FlexLayoutProps) {
  return (
    <div
      className={['gm-stack', className].filter(Boolean).join(' ')}
      style={{ gap: spacing[gap], ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  gap?: SpaceKey;
}

/** Responsive 4/8/12-column grid (mobile/tablet/desktop) driven by breakpoints tokens. */
export function Grid({ children, gap = 'lg', className, style, ...rest }: GridProps) {
  return (
    <div
      className={['gm-grid', className].filter(Boolean).join(' ')}
      style={{ gap: spacing[gap], ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}

export interface SpacerProps {
  size?: SpaceKey;
  axis?: 'horizontal' | 'vertical';
}

/** Fixed-size gap for cases a layout gap prop can't express. */
export function Spacer({ size = 'lg', axis = 'vertical' }: SpacerProps) {
  return (
    <span
      className="gm-spacer"
      style={{
        display: 'block',
        width: axis === 'horizontal' ? spacing[size] : undefined,
        height: axis === 'vertical' ? spacing[size] : undefined,
      }}
      aria-hidden="true"
    />
  );
}
