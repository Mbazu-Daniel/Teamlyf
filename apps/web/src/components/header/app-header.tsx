import { useLocation } from "@tanstack/react-router";
import { IconMenu2 } from "@tabler/icons-react";
import { getBreadcrumbs } from "./breadcrumbs";

type AppHeaderProps = Readonly<{ onToggle: () => void }>;

/** Path-derived breadcrumbs and the sidebar toggle. Workspace selection lives in the sidebar. */
export function AppHeader({ onToggle }: AppHeaderProps) {
  const { pathname } = useLocation();
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
    </header>
  );
}
