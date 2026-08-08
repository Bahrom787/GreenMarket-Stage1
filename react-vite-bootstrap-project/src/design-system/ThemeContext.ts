import { createContext } from 'react';
import { colorTokensByMode, type ColorTokens, type ThemeMode } from '@/design-system/tokens/colors';
import { typeScale } from '@/design-system/tokens/typography';
import * as scales from '@/design-system/tokens/scales';

export interface ThemeContextValue {
  mode: ThemeMode;
  colors: ColorTokens;
  typeScale: typeof typeScale;
  spacing: typeof scales.spacing;
  radius: typeof scales.radius;
  elevation: typeof scales.elevation;
  zIndex: typeof scales.zIndex;
  motion: typeof scales.motion;
  breakpoints: typeof scales.breakpoints;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

export function buildThemeValue(
  mode: ThemeMode,
  setMode: (mode: ThemeMode) => void,
  toggleMode: () => void,
): ThemeContextValue {
  return {
    mode,
    colors: colorTokensByMode[mode],
    typeScale,
    spacing: scales.spacing,
    radius: scales.radius,
    elevation: scales.elevation,
    zIndex: scales.zIndex,
    motion: scales.motion,
    breakpoints: scales.breakpoints,
    setMode,
    toggleMode,
  };
}

export const ThemeContext = createContext<ThemeContextValue>(
  buildThemeValue('light', () => undefined, () => undefined),
);
