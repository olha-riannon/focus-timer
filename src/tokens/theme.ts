export type Theme = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'focus-timer:theme';

const isValidTheme = (value: unknown): value is Theme =>
  value === 'light' || value === 'dark' || value === 'system';

export const getStoredTheme = (): Theme => {
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isValidTheme(raw) ? raw : 'system';
  } catch {
    return 'system';
  }
};

export const storeTheme = (theme: Theme): void => {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* localStorage unavailable — fall back to in-memory state only. */
  }
};

export const applyTheme = (theme: Theme): void => {
  const root = document.documentElement;
  if (theme === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', theme);
  }
};

export const initTheme = (): Theme => {
  const theme = getStoredTheme();
  applyTheme(theme);
  return theme;
};
