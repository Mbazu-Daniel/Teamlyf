import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  accentForeground,
  getCustomAccent,
  getThemePalette,
  setCustomAccent,
  setThemeMode,
  setThemePalette,
} from "@/lib/theme";

describe("custom accent", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("style");
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
  });
  it("persists a validated color and selects a contrasting button foreground", () => {
    setCustomAccent("#ffff00");
    expect(getCustomAccent()).toBe("#ffff00");
    expect(getThemePalette()).toBe("custom");
    expect(document.documentElement.style.getPropertyValue("--primary-foreground")).toBe("#000000");
    expect(accentForeground("#000066")).toBe("#ffffff");
  });
  it("keeps the accent when changing mode and clears overrides for presets", () => {
    setCustomAccent("#112244");
    setThemeMode("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.style.getPropertyValue("--primary")).toBe("#112244");
    setThemePalette("violet");
    expect(document.documentElement.style.getPropertyValue("--primary")).toBe("");
  });
  it("does not accept CSS as a custom color", () => {
    setCustomAccent("url(https://example.test)");
    expect(getThemePalette()).toBe("violet");
  });
});
