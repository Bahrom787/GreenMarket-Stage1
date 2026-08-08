/** 4px base spacing scale. */
export const spacing = {
  none: '0px',
  xxs: '2px',
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  xxl: '32px',
  xxxl: '48px',
  huge: '64px',
} as const;

export const radius = {
  none: '0px',
  sm: '6px',
  md: '10px',
  lg: '16px',
  xl: '24px',
  full: '999px',
} as const;

export const borderWidth = {
  none: '0px',
  hairline: '1px',
  thick: '2px',
} as const;

/** Shadows expressed as raw box-shadow values; consumed through elevation. */
export const shadow = {
  none: 'none',
  sm: '0 1px 2px rgba(15, 20, 17, 0.08)',
  md: '0 4px 12px rgba(15, 20, 17, 0.10)',
  lg: '0 12px 24px rgba(15, 20, 17, 0.14)',
  xl: '0 24px 48px rgba(15, 20, 17, 0.18)',
} as const;

/** Semantic elevation levels mapped to shadow + surface intent. */
export const elevation = {
  level0: shadow.none, // inline / flush with page
  level1: shadow.sm, // list items, chips
  level2: shadow.md, // cards, raised surfaces
  level3: shadow.lg, // bottom sheets, dropdowns
  level4: shadow.xl, // dialogs, modals
} as const;

export const zIndex = {
  base: 0,
  content: 1,
  stickyHeader: 100,
  overlay: 800,
  bottomSheet: 900,
  modal: 1000,
  dialog: 1100,
  snackbar: 1200,
  tooltip: 1300,
} as const;

export const motion = {
  duration: {
    instant: '80ms',
    fast: '140ms',
    normal: '220ms',
    slow: '320ms',
  },
  easing: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    decelerate: 'cubic-bezier(0, 0, 0, 1)',
    accelerate: 'cubic-bezier(0.3, 0, 1, 1)',
  },
} as const;

/** Min-width breakpoints; Mobile is the implicit default below `tablet`. */
export const breakpoints = {
  tablet: '768px',
  desktop: '1120px',
  wide: '1440px',
} as const;
