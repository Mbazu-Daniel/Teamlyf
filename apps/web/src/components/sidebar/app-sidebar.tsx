import { Link, useLocation } from "@tanstack/react-router";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { NAV_SECTIONS, isNavItemActive, type NavItem } from "./nav-items";
import { cn } from "@/lib/utils";
import { useOrganization } from "@/lib/organization";
import { WorkspaceSwitcher } from "./workspace-switcher";

type AppSidebarProps = Readonly<{ collapsed: boolean; onToggle: () => void }>;

const GROUP_HEADING =
  "mt-4 mb-1 px-3 text-[10px] font-bold tracking-[0.14em] text-muted-foreground uppercase first:mt-0";
const LINK_BASE =
  "mb-0.5 flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm whitespace-nowrap transition-colors duration-150";
const LINK_ACTIVE = "bg-background-800 font-semibold text-text-50";
const LINK_IDLE = "text-muted-foreground hover:bg-background-800 hover:text-text-50";

function navLinkClass(active: boolean, collapsed: boolean, available: boolean) {
  return cn(
    LINK_BASE,
    active ? LINK_ACTIVE : LINK_IDLE,
    !available && "cursor-default opacity-55",
    collapsed && "justify-center px-0",
  );
}

// fallow-ignore-next-line complexity -- navigation link handles availability, active state and nested navigation in one reusable primitive
function NavItemLink({
  item,
  active,
  href,
  collapsed,
}: Readonly<{ item: NavItem; active: boolean; href: string; collapsed: boolean }>) {
  const Icon = item.icon;
  const label = collapsed ? undefined : item.label;
  const { pathname, searchStr } = useLocation();
  const { organization } = useOrganization();
  const organizationSlug = organization?.slug || organization?.id || "";

  if (item.available === false) {
    return (
      <div
        title={collapsed ? item.label + " coming soon" : undefined}
        aria-disabled="true"
        className={navLinkClass(false, collapsed, false)}
      >
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        {label && <span className="truncate">{item.label}</span>}
      </div>
    );
  }

  return (
    <>
      <Link to={href} title={label} className={navLinkClass(active, collapsed, true)}>
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        {label && <span className="truncate">{item.label}</span>}
      </Link>
      {active && item.children && !collapsed && (
        <div className="mb-1 ml-3 border-l border-background-700 pl-2">
          {item.children.map((child) => {
            const childActive = pathname.endsWith("/tasks") &&
              new URLSearchParams(searchStr).get("view") === child.to.split("=")[1];
            const ChildIcon = child.icon;
            return (
              <Link
                key={child.id}
                to={"/" + organizationSlug + "/" + child.to}
                className={cn(
                  "flex h-8 items-center gap-2 rounded-md px-2.5 text-xs transition-colors",
                  childActive ? "bg-background-800 text-text-50" : "text-muted-foreground hover:bg-background-800 hover:text-text-50",
                )}
              >
                <ChildIcon className="size-3.5" aria-hidden="true" />
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

// fallow-ignore-next-line complexity -- sidebar composition intentionally owns all primary navigation sections and responsive state
export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const { pathname } = useLocation();
  const { organization } = useOrganization();
  const organizationSlug = organization?.slug || organization?.id || "";

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r border-background-700 bg-background-900/60 transition-[width] duration-200 ease-out",
        collapsed ? "w-16" : "w-[190px]",
      )}
    >
      <div className="border-b border-background-700 px-2 py-2">
        {organization ? <WorkspaceSwitcher collapsed={collapsed} /> : null}
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3" aria-label="Primary">
        {NAV_SECTIONS.map((section) => (
          <div key={section.id}>
            {!collapsed && <p className={GROUP_HEADING}>{section.label}</p>}
            {section.items.map((item) => (
              <NavItemLink
                key={item.id}
                item={item}
                active={isNavItemActive(pathname, item.to)}
                href={item.to ? "/" + organizationSlug + "/" + item.to : "/" + organizationSlug}
                collapsed={collapsed}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t border-background-700">
        <CollapseToggle collapsed={collapsed} onToggle={onToggle} />
      </div>
    </aside>
  );
}

function CollapseToggle({ collapsed, onToggle }: Readonly<{ collapsed: boolean; onToggle: () => void }>) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      className="flex h-11 w-full items-center justify-center gap-2 text-muted-foreground transition-colors duration-150 hover:bg-background-800 hover:text-text-50"
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
