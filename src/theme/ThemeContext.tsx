import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { LightColors, DarkColors } from './colors';

type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  mode: 'light' | 'dark';
  themePreference: ThemeMode;
  colors: typeof LightColors;
  setThemePreference: (m: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  themePreference: 'system',
  colors: LightColors,
  setThemePreference: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themePreference, setThemePreference] = useState<ThemeMode>('system');

  const mode = themePreference === 'system' ? (systemScheme ?? 'light') : themePreference;
  const colors = mode === 'dark' ? DarkColors : LightColors;

  const value = useMemo(() => ({ mode, themePreference, colors, setThemePreference }), [mode, themePreference, colors]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
