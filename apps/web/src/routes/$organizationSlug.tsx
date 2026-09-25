import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/app-shell";
import { SessionGate, BootScreen } from "@/lib/session";
import { useOrganization } from "@/lib/organization";

export const Route = createFileRoute("/$organizationSlug")({
  component: OrganizationLayout,
});

function OrganizationLayout() {
  const { organizationSlug } = Route.useParams();
  const { organization, bootstrapped, resolveSlug } = useOrganization();
  const [resolving, setResolving] = useState(true);

  useEffect(() => {
    if (!bootstrapped) return;
    if (organization?.slug === organizationSlug || organization?.id === organizationSlug) {
      setResolving(false);
      return;
    }

    let active = true;
    setResolving(true);
    void resolveSlug(organizationSlug).then((resolved) => {
      if (!active) return;
      setResolving(false);
      if (!resolved) return;
    });

    return () => {
      active = false;
    };
  }, [bootstrapped, organization, organizationSlug, resolveSlug]);

  return (
    <SessionGate>
      {!bootstrapped || resolving ? (
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
