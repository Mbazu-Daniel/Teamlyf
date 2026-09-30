import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { IconCheck, IconPalette } from "@tabler/icons-react";
import { PageHeader, SettingsSection, WorkspacePage } from "@/components/workspace/page-layout";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { getCustomAccent, setCustomAccent } from "@/lib/theme";

const ACCENTS = [
  ["violet", "#7c3aed"],
  ["blue", "#2563eb"],
  ["green", "#059669"],
  ["orange", "#ea580c"],
  ["rose", "#e11d48"],
] as const;
const STORAGE_KEY = "teamlyf-accent";

export const Route = createFileRoute("/$organizationSlug/appearance")({
  component: AppearancePage,
});

function applyAccent(id: string, color: string) {
  setCustomAccent(color);
  window.localStorage.setItem(STORAGE_KEY, id);
}

function AppearancePage() {
  const [accent, setAccent] = useState("violet");

  useEffect(() => {
    const selected = ACCENTS.find(([, color]) => color === getCustomAccent());
    setAccent(selected?.[0] ?? "custom");
  }, []);

  return (
    <WorkspacePage>
      <PageHeader eyebrow="Make it yours" />
      <SettingsSection
        title="Theme"
        description="Choose light, dark, or match your device using the appearance menu."
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-[12px] bg-primary/10 text-primary">
              <IconPalette className="size-5" />
            </span>
            <div>
              <p className="text-sm font-medium">Workspace theme</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Your preference is saved on this device.
              </p>
            </div>
          </div>
          <ThemeSwitcher />
        </div>
      </SettingsSection>
      <SettingsSection
        title="Accent color"
        description="Choose the accent used for buttons, links, and active states."
      >
        <div className="flex flex-wrap gap-3">
          {ACCENTS.map(([id, color]) => (
            <button
              type="button"
              key={id}
              onClick={() => {
                setAccent(id);
                applyAccent(id, color);
              }}
              className={
                "group flex min-w-[104px] flex-col items-center gap-3 rounded-[14px] border p-4 transition-colors focus-visible:ring-2 focus-visible:ring-primary/30 " +
                (accent === id
                  ? "border-primary/40 bg-primary/5"
                  : "border-border/70 bg-muted/15 hover:bg-muted/40")
              }
              aria-pressed={accent === id}
            >
              <span
                className="grid size-10 place-items-center rounded-full"
                style={{ backgroundColor: color }}
              >
                {accent === id ? <IconCheck className="size-4 text-white" /> : null}
              </span>
              <span className="text-xs font-medium capitalize">{id}</span>
            </button>
          ))}
        </div>
      </SettingsSection>
    </WorkspacePage>
  );
}
