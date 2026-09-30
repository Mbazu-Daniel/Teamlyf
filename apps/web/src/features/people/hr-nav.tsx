import { IconBuilding, IconCalendarOff, IconHierarchy } from "@tabler/icons-react";

// HR covers how the workspace is organised; the member directory lives on its
// own route at /members rather than as a tab here.
const HR_TABS = [
  { section: "departments", label: "Departments", icon: IconBuilding },
  { section: "leave", label: "Leave", icon: IconCalendarOff },
  { section: "org-chart", label: "Org chart", icon: IconHierarchy },
] as const;

export function HrNav({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (section: string) => void;
}) {
  return (
    <nav
      aria-label="HR sections"
      className="shrink-0 border-b border-border/70 bg-gradient-to-b from-muted/40 to-card p-3"
    >
      <div className="flex gap-1 overflow-x-auto">
        {HR_TABS.map(({ section, label, icon: Icon }) => (
          <button
            key={section}
            type="button"
            onClick={() => onSelect(section)}
            aria-current={selected === section ? "page" : undefined}
            className={`flex h-11 shrink-0 items-center gap-2.5 rounded-[10px] px-3 text-[13px] whitespace-nowrap transition-colors ${
              selected === section
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            }`}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
