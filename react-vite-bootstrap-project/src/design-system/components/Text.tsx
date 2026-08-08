import { type ElementType, type ReactNode } from 'react';
import type { TypeScaleKey } from '@/design-system/tokens/typography';
import { typeScale } from '@/design-system/tokens/typography';

type TextTone = 'primary' | 'secondary' | 'tertiary' | 'onBrand' | 'disabled' | 'danger';

export interface TextProps {
  children: ReactNode;
  /** Token-driven type scale entry. Never set font-size/weight inline. */
  variant?: TypeScaleKey;
  tone?: TextTone;
  as?: ElementType;
  className?: string;
  id?: string;
  'data-testid'?: string;
}

const toneClass: Record<TextTone, string> = {
  primary: '',
  secondary: 'gm-text--secondary',
  tertiary: 'gm-text--tertiary',
  onBrand: 'gm-text--on-brand',
  disabled: 'gm-text--disabled',
  danger: 'gm-text--danger',
};

/** Renders any copy in the app using a Design Tokens type scale entry. */
export function Text({
  children,
  variant = 'body',
  tone = 'primary',
  as,
  className,
  id,
  'data-testid': dataTestId,
}: TextProps) {
  const Component = as ?? (variant.startsWith('display') ? 'h1' : 'p');
  const scale = typeScale[variant];
  return (
    <Component
      id={id}
      data-testid={dataTestId}
      className={['gm-text', toneClass[tone], className].filter(Boolean).join(' ')}
      style={{
        fontFamily: scale.fontFamily,
        fontSize: scale.fontSize,
        fontWeight: scale.fontWeight,
        lineHeight: scale.lineHeight,
        letterSpacing: scale.letterSpacing,
      }}
    >
      {children}
    </Component>
  );
}

export interface IconProps {
  children: ReactNode;
  size?: number;
  label?: string;
  className?: string;
}

/**
 * Wraps an inline SVG glyph. Pass `label` for meaningful icons (sets
 * aria-label); decorative icons are hidden from assistive tech by default.
 */
export function Icon({ children, size = 20, label, className }: IconProps) {
  return (
    <span
      className={['gm-icon', className].filter(Boolean).join(' ')}
      style={{ width: size, height: size }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {children}
    </span>
  );
}
