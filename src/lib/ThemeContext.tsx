'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Theme, ThemeName, themes, getTheme } from './themes';

interface ThemeContextType {
  theme: Theme;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>('party');
  const [theme, setThemeState] = useState<Theme>(themes.party);

  useEffect(() => {
    // Load saved theme
    const saved = localStorage.getItem('auction_theme') as ThemeName;
    if (saved && themes[saved]) {
      setThemeName(saved);
      setThemeState(getTheme(saved));
    }
  }, []);

  useEffect(() => {
    // Apply theme CSS variables
    const root = document.documentElement;
    root.style.setProperty('--theme-background', theme.background);
    root.style.setProperty('--theme-primary', theme.primary);
    root.style.setProperty('--theme-primary-dark', theme.primaryDark);
    root.style.setProperty('--theme-secondary', theme.secondary);
    root.style.setProperty('--theme-accent', theme.accent);
    root.style.setProperty('--theme-gradient-start', theme.gradientStart);
    root.style.setProperty('--theme-gradient-mid', theme.gradientMid);
    root.style.setProperty('--theme-gradient-end', theme.gradientEnd);
    
    // Update body background
    document.body.style.background = theme.background;
    document.body.style.backgroundAttachment = 'fixed';
  }, [theme]);

  const setTheme = (name: ThemeName) => {
    setThemeName(name);
    setThemeState(getTheme(name));
    localStorage.setItem('auction_theme', name);
  };

  return (
    <ThemeContext.Provider value={{ theme, themeName, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
