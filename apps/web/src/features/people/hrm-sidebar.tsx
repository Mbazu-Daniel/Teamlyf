import { IconBuilding, IconCalendarOff, IconUsers, IconHierarchy } from "@tabler/icons-react";
import { pageSecondaryAction } from "@/components/workspace/page-layout";

export function HrmSidebar({ selected, onSelect }: { selected: string; onSelect: (section: string) => void }) {
  const items = [["Employees", "employees", IconUsers], ["Departments", "departments", IconBuilding], ["Leave", "leave", IconCalendarOff], ["Org chart", "org-chart", IconHierarchy]] as const;
  return <nav aria-label="HR sections" className="flex flex-wrap gap-2">{items.map(([label, section, Icon]) => <button key={section} className={`${pageSecondaryAction} ${selected === section ? "!bg-primary !text-primary-foreground" : ""}`} onClick={() => onSelect(section)} aria-current={selected === section ? "page" : undefined}><Icon className="size-4" />{label}</button>)}</nav>;
}
