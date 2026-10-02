import { useEffect, useState, type ReactNode } from 'react';

import { ThemeContext } from '../utils/theme';

import type { ResolvedTheme, ThemePreference } from '../utils/types';

import '../styles/foundations.css';

export type ThemeProviderProps = {
  children: ReactNode;
  preference?: ThemePreference;
  onPreferenceChange?: (preference: ThemePreference) => void;
  className?: string;
};

export function ThemeProvider({ children, preference, onPreferenceChange, className = '' }: ThemeProviderProps) {
  const [localPreference, setLocalPreference] = useState<ThemePreference>('system');
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

  const selectedPreference = preference ?? localPreference;
  const resolvedTheme = selectedPreference === 'system' ? systemTheme : selectedPreference;

  useEffect(() => {
    if (selectedPreference !== 'system' || typeof window === 'undefined') return;

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemTheme = () => setSystemTheme(media.matches ? 'dark' : 'light');
    updateSystemTheme();
    media.addEventListener('change', updateSystemTheme);
    return () => media.removeEventListener('change', updateSystemTheme);
  }, [selectedPreference]);

  function setPreference(nextPreference: ThemePreference) {
    if (preference === undefined) setLocalPreference(nextPreference);
    onPreferenceChange?.(nextPreference);
  }

  return (
    <ThemeContext.Provider value={{ preference: selectedPreference, resolvedTheme, setPreference }}>
      <div className={`yb-ui ${className}`.trim()} data-theme={resolvedTheme}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
