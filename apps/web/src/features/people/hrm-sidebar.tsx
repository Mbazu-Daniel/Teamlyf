import { IconBuilding, IconCalendarOff, IconUsers } from "@tabler/icons-react";

export function HrmSidebar({ organizationSlug }: { organizationSlug: string }) {
  const items = [
    ["Employees", "employees", IconUsers],
    ["Departments", "departments", IconBuilding],
    ["Leave", "leave", IconCalendarOff],
  ] as const;

  return (
    <aside className="w-[220px] shrink-0 rounded-[16px] border border-border/60 bg-card p-2">
      <div className="rounded-[14px] border bg-muted/20 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Human Resources</p>
        <p className="mt-1 text-sm font-semibold">Team operations</p>
      </div>
      <nav className="mt-3 space-y-1" aria-label="People and HR sections">
        {items.map(([label, section, Icon]) => (
          <a key={section} href={`/${organizationSlug}/people#${section}`} className="flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm text-muted-foreground hover:bg-primary/5 hover:text-primary">
            <Icon className="size-4" />{label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
