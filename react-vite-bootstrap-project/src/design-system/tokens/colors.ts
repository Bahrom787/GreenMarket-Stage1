/**
 * Color tokens. GreenMarket identity: a living, produce-market green as the
 * primary hue, with a ripe-citrus amber as the single warm accent used
 * sparingly for calls to action and highlights.
 */
export type ThemeMode = 'light' | 'dark';

export interface ColorTokens {
  // Brand
  brandPrimary: string;
  brandPrimaryStrong: string;
  brandPrimarySubtle: string;
  brandAccent: string;
  brandAccentStrong: string;

  // Surfaces
  surfaceBase: string;
  surfaceRaised: string;
  surfaceSunken: string;
  surfaceOverlay: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textOnBrand: string;
  textOnAccent: string;
  textDisabled: string;
  textLink: string;

  // Borders
  borderDefault: string;
  borderSubtle: string;
  borderStrong: string;
  borderFocus: string;

  // Feedback
  success: string;
  successSubtle: string;
  warning: string;
  warningSubtle: string;
  danger: string;
  dangerSubtle: string;
  info: string;
  infoSubtle: string;

  // Interactive states
  hoverOverlay: string;
  pressedOverlay: string;
  selectedSubtle: string;
  disabledSurface: string;
  disabledContent: string;
}

const lightColors: ColorTokens = {
  brandPrimary: '#2F6B4F',
  brandPrimaryStrong: '#1E4A35',
  brandPrimarySubtle: '#E4F0E8',
  brandAccent: '#D98E2B',
  brandAccentStrong: '#B5711A',

  surfaceBase: '#FBFAF7',
  surfaceRaised: '#FFFFFF',
  surfaceSunken: '#F1EFE9',
  surfaceOverlay: 'rgba(20, 24, 21, 0.48)',

  textPrimary: '#171A18',
  textSecondary: '#4B564F',
  textTertiary: '#78837C',
  textOnBrand: '#FFFFFF',
  textOnAccent: '#20140A',
  textDisabled: '#A9B0AB',
  textLink: '#2F6B4F',

  borderDefault: '#DEDAD0',
  borderSubtle: '#EBE8E0',
  borderStrong: '#B7B0A1',
  borderFocus: '#2F6B4F',

  success: '#2F6B4F',
  successSubtle: '#E4F0E8',
  warning: '#B5711A',
  warningSubtle: '#FBEDD9',
  danger: '#B3402E',
  dangerSubtle: '#F7E2DD',
  info: '#2E6C8E',
  infoSubtle: '#E1EEF4',

  hoverOverlay: 'rgba(23, 26, 24, 0.06)',
  pressedOverlay: 'rgba(23, 26, 24, 0.12)',
  selectedSubtle: '#E4F0E8',
  disabledSurface: '#EFEDE7',
  disabledContent: '#A9B0AB',
};

const darkColors: ColorTokens = {
  brandPrimary: '#5FA980',
  brandPrimaryStrong: '#8AC7A5',
  brandPrimarySubtle: '#1B3226',
  brandAccent: '#E4A64B',
  brandAccentStrong: '#F0BE71',

  surfaceBase: '#14171A',
  surfaceRaised: '#1C2023',
  surfaceSunken: '#0E1012',
  surfaceOverlay: 'rgba(0, 0, 0, 0.6)',

  textPrimary: '#F3F4F1',
  textSecondary: '#C2C8C3',
  textTertiary: '#8D948E',
  textOnBrand: '#0E1712',
  textOnAccent: '#20140A',
  textDisabled: '#5C625D',
  textLink: '#8AC7A5',

  borderDefault: '#31363A',
  borderSubtle: '#24282B',
  borderStrong: '#484F53',
  borderFocus: '#5FA980',

  success: '#5FA980',
  successSubtle: '#1B3226',
  warning: '#E4A64B',
  warningSubtle: '#332512',
  danger: '#E08571',
  dangerSubtle: '#3A2119',
  info: '#7EB8DA',
  infoSubtle: '#152A35',

  hoverOverlay: 'rgba(255, 255, 255, 0.06)',
  pressedOverlay: 'rgba(255, 255, 255, 0.12)',
  selectedSubtle: '#1B3226',
  disabledSurface: '#202427',
  disabledContent: '#5C625D',
};

export const colorTokensByMode: Record<ThemeMode, ColorTokens> = {
  light: lightColors,
  dark: darkColors,
};
