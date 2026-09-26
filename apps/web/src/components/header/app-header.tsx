import { useLocation } from "@tanstack/react-router";
import { IconMenu2 } from "@tabler/icons-react";
import { getBreadcrumbs } from "./breadcrumbs";
import { UserFooter } from "@/components/sidebar/user-footer";
import { WorkspaceSwitcher } from "@/components/sidebar/workspace-switcher";
import { useOrganization } from "@/lib/organization";

type AppHeaderProps = Readonly<{ onToggle: () => void }>;

/** Path-derived breadcrumbs. Organization selection stays on the left; account controls stay on the right. */
export function AppHeader({ onToggle }: AppHeaderProps) {
  const { pathname } = useLocation();
  const crumbs = getBreadcrumbs(pathname);
  const { organization } = useOrganization();

  return (
    <header className="app-topbar sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border px-3 sm:px-5">
      <button
        type="button"
        onClick={onToggle}
        aria-label="Toggle sidebar"
        className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <IconMenu2 className="size-5" aria-hidden="true" />
      </button>

      {organization && <WorkspaceSwitcher collapsed={false} />}

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
                <span className="truncate font-bold" aria-current={index === crumbs.length - 1 ? "page" : undefined}>
                  {crumb.label}
                </span>
              </li>
            ))}
          </ol>
        )}
      </nav>

      <UserFooter collapsed={false} />
    </header>
  );
}
