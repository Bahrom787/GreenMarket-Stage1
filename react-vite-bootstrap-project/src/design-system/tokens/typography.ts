/**
 * Typography tokens. A grounded grotesque for UI text paired with a warmer
 * serif reserved for display moments (screen titles, empty-state headlines).
 */
export const fontFamily = {
  display: "'Fraunces', Georgia, 'Times New Roman', serif",
  body: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
  mono: "'IBM Plex Mono', ui-monospace, SFMono-Regular, monospace",
};

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

export const fontSize = {
  xs: '12px',
  sm: '13px',
  md: '15px',
  lg: '17px',
  xl: '20px',
  xxl: '24px',
  display1: '30px',
  display2: '38px',
};

export const lineHeight = {
  tight: 1.2,
  snug: 1.35,
  normal: 1.5,
  relaxed: 1.65,
};

export const letterSpacing = {
  tight: '-0.01em',
  normal: '0em',
  wide: '0.02em',
  caps: '0.06em',
};

export const typeScale = {
  displayLg: {
    fontFamily: fontFamily.display,
    fontSize: fontSize.display2,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  displaySm: {
    fontFamily: fontFamily.display,
    fontSize: fontSize.display1,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.tight,
    letterSpacing: letterSpacing.tight,
  },
  headline: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.normal,
  },
  title: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.snug,
    letterSpacing: letterSpacing.normal,
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  bodyStrong: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  caption: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.normal,
  },
  overline: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.normal,
    letterSpacing: letterSpacing.caps,
  },
} as const;

export type TypeScaleKey = keyof typeof typeScale;
