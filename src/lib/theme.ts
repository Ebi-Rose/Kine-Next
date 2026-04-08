/**
 * Theme (dark/light) — persisted in localStorage, with prefers-color-scheme as default.
 *
 * The initial apply happens via an inline script in src/app/layout.tsx to avoid
 * a flash of the wrong theme on first paint. Runtime toggles go through setTheme().
 */

export type Theme = "dark" | "light";

export const THEME_KEY = "kine_theme";

export function getTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function setTheme(t: Theme) {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_KEY, t);
  document.documentElement.classList.toggle("light", t === "light");
  // Keep the iOS status bar / PWA chrome color in sync
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", t === "light" ? "#f6f1ea" : "#13110f");
}
