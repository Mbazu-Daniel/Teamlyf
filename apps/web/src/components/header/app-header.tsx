import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { IconBuilding, IconLogout, IconMenu2 } from "@tabler/icons-react";
import { signOut } from "@/lib/api";
import { useResetSession } from "@/lib/session";
import { useOrganization } from "@/lib/organization";
import { NAV_ITEMS, isNavItemActive } from "@/components/sidebar/nav-items";

type AppHeaderProps = Readonly<{ onToggle: () => void }>;

/** Breadcrumb from the current path, plus workspace context and sign out. */
export function AppHeader({ onToggle }: AppHeaderProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const resetSession = useResetSession();
  const { organization, reset: resetWorkspace } = useOrganization();

  const matches = NAV_ITEMS.filter((item) => isNavItemActive(pathname, item.to));
  const crumb = matches[matches.length - 1];

  async function handleSignOut() {
    try {
      await signOut();
    } finally {
      // Forget both the session and the workspace, or the guard reads a
      // signed-in user (and their old workspace) from cache on the next visit.
      resetSession();
      resetWorkspace();
      await navigate({ to: "/sign-in" });
    }
  }

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
        <p className="truncate text-sm">
          <span className="text-muted-foreground">Teamlyf</span>
          <span className="mx-2 text-muted-foreground/60" aria-hidden="true">
            /
          </span>
          <span className="font-bold">{crumb?.label ?? "Home"}</span>
        </p>
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

      <Link
        to="/sign-in"
        onClick={(event) => {
          event.preventDefault();
          void handleSignOut();
        }}
        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
      >
        <IconLogout className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Sign out</span>
      </Link>
    </header>
  );
}
