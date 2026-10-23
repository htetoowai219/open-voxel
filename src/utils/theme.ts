import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'open-voxel-theme';
const THEME_CHANGE_EVENT = 'open-voxel-theme-change';

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // localStorage can be unavailable in hardened browser contexts.
  }
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.classList.toggle('light', theme === 'light');
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Persisting is a progressive enhancement.
  }
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: theme }));
}

export function useTheme(): [Theme, () => void, (theme: Theme) => void] {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);
    const handler = (event: Event) => {
      const custom = event as CustomEvent<Theme>;
      if (custom.detail && custom.detail !== theme) setThemeState(custom.detail);
    };
    window.addEventListener(THEME_CHANGE_EVENT, handler);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, handler);
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setThemeState(next);
    applyTheme(next);
  };

  const setTheme = (next: Theme) => {
    setThemeState(next);
    applyTheme(next);
  };

  return [theme, toggleTheme, setTheme];
}
