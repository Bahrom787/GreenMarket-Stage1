import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ThemeContext, buildThemeValue } from '@/design-system/ThemeContext';
import type { ThemeMode } from '@/design-system/tokens/colors';
import '@/design-system/tokens.css';

interface ThemeProviderProps {
  children: ReactNode;
  /** Initial theme mode. Defaults to the user's OS preference. */
  defaultMode?: ThemeMode;
}

function getPreferredMode(): ThemeMode {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Provides Design Tokens and theme mode to every component in the tree.
 * All base UI components must consume tokens through this provider
 * (directly via useTheme, or indirectly via the CSS variables it sets).
 */
export function ThemeProvider({ children, defaultMode }: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(defaultMode ?? getPreferredMode());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => setModeState(next), []);
  const toggleMode = useCallback(
    () => setModeState((current) => (current === 'light' ? 'dark' : 'light')),
    [],
  );

  const value = useMemo(() => buildThemeValue(mode, setMode, toggleMode), [mode, setMode, toggleMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
