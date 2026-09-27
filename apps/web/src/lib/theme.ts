export type ThemeMode = "light" | "dark" | "system";
export type ThemePalette = "violet" | "ocean" | "rose" | "forest";

const MODE_STORAGE_KEY = "teamlyf-theme";
const PALETTE_STORAGE_KEY = "teamlyf-theme-palette";
const THEME_CHANGE_EVENT = "teamlyf:theme-change";

const PALETTES: readonly ThemePalette[] = ["violet", "ocean", "rose", "forest"];

function systemPrefersDark() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function getThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const value = window.localStorage.getItem(MODE_STORAGE_KEY);
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}

export function getThemePalette(): ThemePalette {
  if (typeof window === "undefined") return "violet";
  const value = window.localStorage.getItem(PALETTE_STORAGE_KEY);
  return PALETTES.includes(value as ThemePalette) ? (value as ThemePalette) : "violet";
}

function emitThemeChange() {
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

function applyTheme(mode: ThemeMode, palette = getThemePalette()) {
  const root = document.documentElement;
  const dark = mode === "dark" || (mode === "system" && systemPrefersDark());
  root.classList.toggle("dark", dark);
  root.classList.toggle("light", !dark);
  root.dataset.themePalette = palette;
  root.style.colorScheme = dark ? "dark" : "light";
}

export function setThemeMode(mode: ThemeMode) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MODE_STORAGE_KEY, mode);
  applyTheme(mode);
  emitThemeChange();
}

export function setThemePalette(palette: ThemePalette) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PALETTE_STORAGE_KEY, palette);
  applyTheme(getThemeMode(), palette);
  emitThemeChange();
}

export function subscribeToThemeChange(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(THEME_CHANGE_EVENT, listener);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, listener);
}

export function initializeTheme() {
  if (typeof window === "undefined") return () => undefined;
  const mode = getThemeMode();
  applyTheme(mode, getThemePalette());

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    if (getThemeMode() === "system") applyTheme("system");
  };
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
