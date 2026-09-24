import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/app/app-shell";
import { SessionGate, BootScreen } from "@/lib/session";
import { useOrganization } from "@/lib/organization";

/**
 * Pathless layout: every signed-in app page renders inside the shell.
 * Mounted once, so the sidebar and top bar persist across navigations.
 *
 * Two gates run before any page renders:
 * 1. signed out  -> /sign-in
 * 2. no workspace -> /workspaces
 *
 * Public routes (landing, sign-in, sign-up) stay outside this folder.
 */
export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { organization, bootstrapped } = useOrganization();

  return (
    <SessionGate>
      {!bootstrapped ? (
        <BootScreen />
      ) : !organization ? (
        <Navigate to="/workspaces" />
      ) : (
        <AppShell>
          <Outlet />
        </AppShell>
      )}
    </SessionGate>
  );
}
