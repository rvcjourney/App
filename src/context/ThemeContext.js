import React, { createContext, useContext, useMemo, useState } from 'react';

const lightPalette = {
  // keep app background light, use purple only for cards/buttons
  background: '#F4F5F7',
  card: '#FFFFFF',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  accent: '#8000FF', // rgb(128, 0, 255) for cards/buttons
  border: '#E5E7EB',
  bottomNav: '#FFFFFF',
};

const darkPalette = {
  background: '#0B0D2A',
  card: '#1C1F4A',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  accent: '#5568FE',
  border: '#1F2933',
  bottomNav: '#0B0D2A',
};

const ThemeContext = createContext({
  mode: 'dark',
  colors: darkPalette,
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const [mode, setMode] = useState('dark');

  const value = useMemo(() => {
    const colors = mode === 'light' ? lightPalette : darkPalette;
    return {
      mode,
      colors,
      toggleTheme: () =>
        setMode((prev) => (prev === 'light' ? 'dark' : 'light')),
    };
  }, [mode]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

