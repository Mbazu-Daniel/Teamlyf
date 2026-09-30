export type ThemeMode = "light" | "dark" | "system";
export type ThemePalette = "violet" | "ocean" | "rose" | "forest" | "custom";

const MODE_STORAGE_KEY = "teamlyf-theme";
const PALETTE_STORAGE_KEY = "teamlyf-theme-palette";
const THEME_CHANGE_EVENT = "teamlyf:theme-change";

const PALETTES: readonly ThemePalette[] = ["violet", "ocean", "rose", "forest", "custom"];

export function getCustomAccent() {
  if (typeof window === "undefined") return "#7c3aed";
  const stored = window.localStorage.getItem("teamlyf-custom-accent");
  return stored && /^#[0-9a-f]{6}$/i.test(stored) ? stored : "#7c3aed";
}

export function accentForeground(color: string) {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return "#ffffff";
  const rgb = [1, 3, 5]
    .map((offset) => parseInt(color.slice(offset, offset + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const luminance = rgb[0]! * 0.2126 + rgb[1]! * 0.7152 + rgb[2]! * 0.0722;
  return luminance > 0.179 ? "#000000" : "#ffffff";
}

export function setCustomAccent(color: string) {
  if (typeof window === "undefined" || !/^#[0-9a-f]{6}$/i.test(color)) return;
  window.localStorage.setItem("teamlyf-custom-accent", color);
  setThemePalette("custom");
}

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
  const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  for (const name of [
    "--primary",
    "--primary-foreground",
    "--ring",
    ...shades.map((shade) => `--primary-${shade}`),
  ])
    root.style.removeProperty(name);
  if (palette === "custom") {
    const color = getCustomAccent();
    root.style.setProperty("--primary", color);
    root.style.setProperty("--primary-foreground", accentForeground(color));
    root.style.setProperty("--ring", color);
    for (const shade of shades)
      root.style.setProperty(
        `--primary-${shade}`,
        shade === 500
          ? color
          : `color-mix(in srgb, ${color} ${100 - Math.abs(shade - 500) / 5}%, ${shade < 500 ? "white" : "black"})`,
      );
  }
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
