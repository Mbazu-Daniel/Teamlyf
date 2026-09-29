import { useEffect, useState } from "react";
import {
  IconCheck,
  IconDeviceDesktop,
  IconMoonStars,
  IconPalette,
  IconSun,
} from "@tabler/icons-react";
import {
  getThemeMode,
  getCustomAccent,
  setCustomAccent,
  getThemePalette,
  setThemeMode,
  setThemePalette,
  subscribeToThemeChange,
  type ThemeMode,
  type ThemePalette,
} from "@/lib/theme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type ThemeSwitcherProps = Readonly<{ variant?: "app" | "landing"; compact?: boolean }>;

const modes: readonly { mode: ThemeMode; label: string; icon: typeof IconSun }[] = [
  { mode: "light", label: "Light", icon: IconSun },
  { mode: "dark", label: "Dark", icon: IconMoonStars },
  { mode: "system", label: "System", icon: IconDeviceDesktop },
];

const palettes: readonly {
  id: ThemePalette;
  label: string;
  description: string;
  swatch: string;
}[] = [
  { id: "violet", label: "Violet", description: "Default", swatch: "theme-swatch-violet" },
  { id: "ocean", label: "Ocean", description: "Clear blue", swatch: "theme-swatch-ocean" },
  { id: "rose", label: "Rose", description: "Warm magenta", swatch: "theme-swatch-rose" },
  { id: "forest", label: "Forest", description: "Grounded green", swatch: "theme-swatch-forest" },
];

export function ThemeSwitcher({ variant = "app", compact = false }: ThemeSwitcherProps) {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [palette, setPalette] = useState<ThemePalette>("violet");
  const [custom, setCustom] = useState("#7c3aed");

  useEffect(() => {
    const sync = () => {
      setMode(getThemeMode());
      setPalette(getThemePalette());
      setCustom(getCustomAccent());
    };
    sync();
    return subscribeToThemeChange(sync);
  }, []);

  const buttonClass =
    variant === "landing"
      ? "landing-theme-trigger border-[var(--landing-line)] bg-[var(--landing-surface)] text-[var(--landing-ink)] hover:bg-[var(--landing-soft)]"
      : "border-border bg-card text-foreground hover:bg-muted";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Change appearance"
            title="Appearance"
            className={cn(
              "inline-flex h-9 items-center justify-center gap-2 rounded-full border px-3 text-sm font-semibold transition-colors",
              buttonClass,
              compact && "size-8 rounded-lg px-0",
            )}
          >
            <IconPalette className="size-4" aria-hidden="true" />
            {!compact && <span className="hidden sm:inline">Theme</span>}
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Appearance</DropdownMenuLabel>
          <div className="grid grid-cols-3 gap-1 px-1 pb-2">
            {modes.map(({ mode: option, label, icon: Icon }) => (
              <button
                key={option}
                type="button"
                onClick={() => setThemeMode(option)}
                className={cn(
                  "relative flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg border px-2 text-xs font-semibold transition-colors",
                  mode === option
                    ? "border-primary-400 bg-primary-500/15 text-primary-300"
                    : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
                {mode === option && (
                  <IconCheck
                    className="absolute right-1.5 top-1.5 size-3 text-primary-300"
                    aria-hidden="true"
                  />
                )}
              </button>
            ))}
          </div>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel>Custom palette</DropdownMenuLabel>
          <div className="grid grid-cols-2 gap-1 p-1">
            {palettes.map(({ id, label, description, swatch }) => (
              <button
                key={id}
                type="button"
                onClick={() => setThemePalette(id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border p-2 text-left transition-colors",
                  palette === id
                    ? "border-primary-400 bg-primary-500/10"
                    : "border-transparent hover:bg-muted",
                )}
              >
                <span
                  className={cn("grid size-7 place-items-center rounded-full", swatch)}
                  aria-hidden="true"
                >
                  {palette === id && <IconCheck className="size-4 text-white" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-semibold">{label}</span>
                  <span className="block text-[0.6875rem] text-muted-foreground">
                    {description}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </DropdownMenuGroup>
        <DropdownMenuGroup><DropdownMenuLabel>Custom accent</DropdownMenuLabel><label className="flex items-center justify-between gap-3 px-3 pb-3 text-xs"><span>Choose any color</span><input aria-label="Custom accent color" type="color" value={custom} onChange={(event) => setCustomAccent(event.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border bg-card" /></label></DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
