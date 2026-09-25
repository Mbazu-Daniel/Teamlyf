import { Link, useLocation } from "@tanstack/react-router";
import { IconBuilding, IconMenu2 } from "@tabler/icons-react";
import { useOrganization } from "@/lib/organization";
import { getBreadcrumbs } from "./breadcrumbs";

type AppHeaderProps = Readonly<{ onToggle: () => void }>;

/**
 * Path-derived breadcrumbs, the workspace chip (back to the picker) and the
 * sidebar toggle. Sign out lives in the sidebar user menu — one home for it.
 */
export function AppHeader({ onToggle }: AppHeaderProps) {
  const { pathname } = useLocation();
  const { organization } = useOrganization();
  const crumbs = getBreadcrumbs(pathname);

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

      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex min-w-0 items-center gap-1.5 text-sm">
          {crumbs.map((crumb, index) => (
            <li key={crumb.to} className="flex min-w-0 items-center gap-1.5">
              {index > 0 && (
                <span className="text-muted-foreground/60" aria-hidden="true">
                  /
                </span>
              )}
              {index === crumbs.length - 1 ? (
                <span className="truncate font-bold" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.to}
                  className="truncate text-muted-foreground transition-colors hover:text-foreground"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {organization && (
        <Link
          to="/workspaces"
          title="Switch workspace"
          className="hidden min-w-0 items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
        >
          <IconBuilding className="size-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{organization.name}</span>
        </Link>
      )}
    </header>
  );
}
