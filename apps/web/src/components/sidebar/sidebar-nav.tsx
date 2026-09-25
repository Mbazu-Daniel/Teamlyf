import { Link, useLocation } from "@tanstack/react-router";
import { NAV_SECTIONS, findActiveNavItem, type NavItem } from "./nav-items";
import { cn } from "@/lib/utils";

const GROUP_HEADING =
  "mt-3 mb-1 px-3 text-xs font-bold tracking-[0.12em] text-muted-foreground uppercase first:mt-0";
const LINK_BASE =
  "mb-0.5 flex h-9 items-center gap-2.5 rounded-lg border-l-2 px-3 text-sm whitespace-nowrap transition-colors duration-150";
const LINK_ACTIVE = "border-primary-400 bg-primary-500/12 font-bold text-primary-300";
const LINK_IDLE = "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground";

function navLinkClass(active: boolean, collapsed: boolean) {
  return cn(LINK_BASE, active ? LINK_ACTIVE : LINK_IDLE, collapsed && "justify-center px-0");
}

function NavItemLink({
  item,
  active,
  collapsed,
}: Readonly<{ item: NavItem; active: boolean; collapsed: boolean }>) {
  const Icon = item.icon;
  const label = collapsed ? undefined : item.label;

  return (
    <Link to={item.to} title={label} className={navLinkClass(active, collapsed)}>
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {label && <span className="truncate">{label}</span>}
    </Link>
  );
}

/** Renders `NAV_SECTIONS` as grouped links; new sections appear without touching this file. */
export function SidebarNav({ collapsed }: Readonly<{ collapsed: boolean }>) {
  const { pathname } = useLocation();
  const active = findActiveNavItem(pathname);

  return (
    <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3" aria-label="Primary">
      {NAV_SECTIONS.map((section) => (
        <div key={section.id}>
          {!collapsed && <p className={GROUP_HEADING}>{section.label}</p>}
          {section.items.map((item) => (
            <NavItemLink
              key={item.id}
              item={item}
              active={active?.id === item.id}
              collapsed={collapsed}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}
