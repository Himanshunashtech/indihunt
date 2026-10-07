export type Theme = "light" | "dark";

/**
 * Global default theme setting.
 * Configured via NEXT_PUBLIC_DEFAULT_THEME in .env (defaults to "dark").
 * Change NEXT_PUBLIC_DEFAULT_THEME in .env or update this fallback to switch back to "light".
 */
export const DEFAULT_THEME: Theme =
  (process.env.NEXT_PUBLIC_DEFAULT_THEME as Theme) || "dark";

/**
 * Reads initial theme from localStorage with DEFAULT_THEME fallback.
 * Automatically saves DEFAULT_THEME to localStorage if no preference is stored.
 */
export function getInitialTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved === "light" || saved === "dark") {
      return saved;
    }
    localStorage.setItem("theme", DEFAULT_THEME);
    return DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/**
 * Applies or removes the 'dark' class on <html> document element.
 */
export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}
