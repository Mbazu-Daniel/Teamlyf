import { useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { IconMenu2 } from "@tabler/icons-react";
import { getBreadcrumbs } from "./breadcrumbs";
import { UserFooter } from "@/components/sidebar/user-footer";
import { useOrganization } from "@/lib/organization";
import { projectsApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { NotificationBell } from "@/features/notifications/feed";
import { useIsMobile } from "@/hooks/use-mobile";

type AppHeaderProps = Readonly<{ onToggle: () => void }>;

export function AppHeader({ onToggle }: AppHeaderProps) {
  const mobile = useIsMobile();
  const { pathname, searchStr } = useLocation();
  const { organization } = useOrganization();
  const organizationId = organization?.id ?? "";

  const projectsQuery = useQuery({
    queryKey: queryKeys.projects(organizationId),
    queryFn: () => projectsApi.getProjects(organizationId),
    enabled: Boolean(organizationId) && pathname.includes("/projects/"),
    retry: false,
  });
  const crumbs = getBreadcrumbs(pathname, projectsQuery.data ?? [], searchStr);

  return (
    <header className="app-topbar sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 px-4 sm:px-6">
      <button
        type="button"
        onClick={onToggle}
        aria-label="Toggle sidebar"

        className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground md:hidden"
      >
        <IconMenu2 className="size-5" aria-hidden="true" />
      </button>

      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        {crumbs.length > 0 && (
          <ol className="flex min-w-0 items-center gap-1.5 text-sm">
            {crumbs.map((crumb, index) => (
              <li key={crumb.to} className="flex min-w-0 items-center gap-1.5">
                {index > 0 && (
                  <span className="text-muted-foreground/60" aria-hidden="true">
                    /
                  </span>
                )}
                <span
                  className="truncate text-[13px] font-semibold"
                  aria-current={index === crumbs.length - 1 ? "page" : undefined}
                >
                  {crumb.label}
                </span>
              </li>
            ))}
          </ol>
        )}
      </nav>

      <NotificationBell />
      <UserFooter collapsed={mobile} compact />
    </header>
  );
}
