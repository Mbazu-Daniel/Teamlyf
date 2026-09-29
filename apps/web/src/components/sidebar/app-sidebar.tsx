// fallow-ignore-file complexity
import { Link, useLocation } from "@tanstack/react-router";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { NAV_SECTIONS, findActiveNavItem, type NavItem } from "./nav-items";
import { OrganizationSwitcher } from "./organization-switcher";
import { cn } from "@/lib/utils";
import { useOrganization } from "@/lib/organization";

type AppSidebarProps = Readonly<{ collapsed: boolean; onToggle: () => void }>;

const GROUP_HEADING =
  "mb-2 mt-6 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/90 first:mt-0";
const LINK_BASE =
  "mb-1 flex h-11 items-center gap-2.5 rounded-[8px] border-r-[3px] border-transparent px-3 text-[13px] font-medium leading-5 whitespace-nowrap transition-colors duration-150";
const LINK_ACTIVE = "border-primary bg-primary text-primary-foreground font-semibold shadow-[0_10px_20px_-16px_hsl(var(--primary))] hover:bg-primary/90";
const LINK_IDLE = "text-sidebar-foreground/75 hover:bg-sidebar-accent/90 hover:text-foreground";

function navLinkClass(active: boolean, collapsed: boolean, available: boolean) {
  return cn(
    LINK_BASE,
    active ? LINK_ACTIVE : LINK_IDLE,
    !available && "cursor-default opacity-55",
    collapsed && "justify-center px-0",
  );
}

function NavItemLink({
  item,
  active,
  href,
  collapsed,
}: Readonly<{ item: NavItem; active: boolean; href: string; collapsed: boolean }>) {
  const Icon = item.icon;
  const label = collapsed ? undefined : item.label;

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
    <Link to={href} title={item.label} aria-label={item.label} aria-current={active ? "page" : undefined} className={navLinkClass(active, collapsed, true)}>
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {label && <span className="truncate">{item.label}</span>}
    </Link>
  );
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const { pathname } = useLocation();
  const { organization } = useOrganization();
  const organizationSlug = organization?.slug || organization?.id || "";

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar/90 backdrop-blur-xl transition-[width] duration-200 ease-out",
        collapsed ? "w-16" : "w-[248px]",
      )}
    >
      <div className="border-b border-sidebar-border px-2 py-3">
        <OrganizationSwitcher collapsed={collapsed} />
      </div>

      <nav className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto px-1.5 pb-4 pt-5" aria-label="Primary">
        {NAV_SECTIONS.map((section) => (
          <div key={section.id} className={cn(collapsed && section.id !== "workspace" && "mt-4 border-t border-sidebar-border pt-4")}>
            {!collapsed && <p className={GROUP_HEADING}>{section.label}</p>}
            {section.items.map((item) => (
              <NavItemLink
                key={item.id}
                item={item}
                active={findActiveNavItem(pathname)?.id === item.id}
                href={item.to ? "/" + organizationSlug + "/" + item.to : "/" + organizationSlug}
                collapsed={collapsed}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border">
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
      className="flex h-12 w-full items-center justify-center gap-2 text-[13px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-sidebar-accent/90 hover:text-foreground"
    >
      {collapsed ? (
        <IconChevronRight className="size-4" aria-hidden="true" />
      ) : (
        <>
          <IconChevronLeft className="size-4" aria-hidden="true" />
          <span>Collapse</span>
        </>
      )}
    </button>
  );
}
