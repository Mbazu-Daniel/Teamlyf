import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { IconCheck, IconPalette } from "@tabler/icons-react";

const ACCENTS = [
  ["violet", "#7c3aed"],
  ["blue", "#2563eb"],
  ["green", "#059669"],
  ["orange", "#ea580c"],
  ["rose", "#e11d48"],
] as const;
const STORAGE_KEY = "teamlyf-accent";

export const Route = createFileRoute("/$organizationSlug/appearance")({ component: AppearancePage });

function applyAccent(id: string, color: string) {
  document.documentElement.style.setProperty("--primary", color);
  document.documentElement.style.setProperty("--primary-500", color);
  document.documentElement.style.setProperty("--ring", color);
  window.localStorage.setItem(STORAGE_KEY, id);
}

function AppearancePage() {
  const [accent, setAccent] = useState("violet");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) ?? "violet";
    const selected = ACCENTS.find(([id]) => id === stored) ?? ACCENTS[0];
    setAccent(selected[0]);
    applyAccent(selected[0], selected[1]);
  }, []);

  return (
    <div className="mx-auto flex h-full w-full max-w-[900px] flex-col gap-5 overflow-y-auto p-4 md:p-8">
      <header><div className="flex items-center gap-2"><IconPalette className="size-5 text-primary" /><h1 className="text-2xl font-semibold">Appearance</h1></div><p className="mt-1 text-sm text-muted-foreground">Customize how Teamlyf looks for you.</p></header>
      <section className="overflow-hidden rounded-[16px] border bg-white shadow-sm dark:bg-card">
        <div className="border-b bg-muted/20 px-6 py-5"><h2 className="text-sm font-semibold">Accent color</h2><p className="mt-1 text-xs text-muted-foreground">Choose the accent used for buttons, links and highlights.</p></div>
        <div className="px-6 py-6"><div className="flex flex-wrap gap-5">
          {ACCENTS.map(([id, color]) => (
            <button type="button" key={id} onClick={() => { setAccent(id); applyAccent(id, color); }} className="group flex flex-col items-center gap-2" aria-pressed={accent === id}>
              <span className={"grid size-11 place-items-center rounded-full border-2 shadow-sm transition " + (accent === id ? "scale-110 ring-2 ring-primary/20" : "")} style={{ backgroundColor: color }}>{accent === id ? <IconCheck className="size-4 text-white" /> : null}</span>
              <span className="text-[10px] font-medium capitalize text-muted-foreground">{id}</span>
            </button>
          ))}
        </div></div>
      </section>
    </div>
  );
}
