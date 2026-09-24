import {
  IconCalendarTime,
  IconFileText,
  IconLayoutKanban,
  IconMessages,
  IconNotes,
  IconRobot,
  IconUsers,
} from "@tabler/icons-react";

const modules = [
  { name: "Projects", icon: IconLayoutKanban },
  { name: "Chat", icon: IconMessages },
  { name: "Documents", icon: IconFileText },
  { name: "Notes", icon: IconNotes },
  { name: "HR", icon: IconUsers },
  { name: "Calls", icon: IconCalendarTime },
  { name: "Agents", icon: IconRobot },
] as const;

/** Hairline module strip — replaces the reference's fabricated logo wall with real product facts. */
export function ModuleStrip() {
  return (
    <section className="border-y border-border bg-background-900/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 sm:py-10">
        <h2 className="text-sm font-bold tracking-[0.12em] text-muted-foreground uppercase">
          Built as one product
        </h2>
        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
          {modules.map(({ name, icon: Icon }) => (
            <li key={name} className="flex items-center gap-2 text-text-200">
              <Icon className="size-4 text-primary-300" aria-hidden="true" />
              <span className="font-bold">{name}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
