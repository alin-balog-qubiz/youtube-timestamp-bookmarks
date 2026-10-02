import { createContext, useContext } from 'react';

import type { ResolvedTheme, ThemePreference } from './types';

export type ThemeContextValue = {
  preference: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('Design-system components must be inside ThemeProvider.');

  return theme;
}
