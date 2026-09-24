import { Link, useLocation } from "@tanstack/react-router";
import { IconChevronLeft, IconChevronRight, IconRocket } from "@tabler/icons-react";
import { NAV_ITEMS, isNavItemActive, type NavItem } from "./nav-items";
import { cn } from "@/lib/utils";

type AppSidebarProps = Readonly<{ collapsed: boolean; onToggle: () => void }>;

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
      {label && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

function CollapseToggle({ collapsed, onToggle }: Readonly<{ collapsed: boolean; onToggle: () => void }>) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      className="flex h-11 items-center justify-center gap-2 border-t border-border text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
    >
      {collapsed ? (
        <IconChevronRight className="size-4" aria-hidden="true" />
      ) : (
        <>
          <IconChevronLeft className="size-4" aria-hidden="true" />
          <span className="text-sm">Collapse</span>
        </>
      )}
    </button>
  );
}

/** First item of a group starts that group's heading. */
function isGroupStart(index: number) {
  return index === 0 || NAV_ITEMS[index - 1].group !== NAV_ITEMS[index].group;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const { pathname } = useLocation();

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r border-border bg-background-900/60 transition-[width] duration-200 ease-out",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div className="flex h-14 items-center border-b border-border px-4">
        <Link to="/" className="flex min-w-0 items-center gap-2 font-bold tracking-tight">
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
            <IconRocket className="size-4" />
          </span>
          {!collapsed && <span className="truncate">Teamlyf</span>}
        </Link>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3" aria-label="Primary">
        {NAV_ITEMS.map((item, index) => {
          const showHeading = isGroupStart(index) && !collapsed;

          return (
            <div key={item.to}>
              {showHeading && <p className={GROUP_HEADING}>{item.group}</p>}
              <NavItemLink
                item={item}
                active={isNavItemActive(pathname, item.to)}
                collapsed={collapsed}
              />
            </div>
          );
        })}
      </nav>

      <CollapseToggle collapsed={collapsed} onToggle={onToggle} />
    </aside>
  );
}
