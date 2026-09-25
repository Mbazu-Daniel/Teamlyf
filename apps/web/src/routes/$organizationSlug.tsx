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
  const [validOrganization, setValidOrganization] = useState(false);

  useEffect(() => {
    if (!bootstrapped) return;
    if (organization?.slug === organizationSlug || organization?.id === organizationSlug) {
      setValidOrganization(true);
      setResolving(false);
      return;
    }

    setValidOrganization(false);

    let active = true;
    setResolving(true);
    void resolveSlug(organizationSlug).then((resolved) => {
      if (!active) return;
      setResolving(false);
      setValidOrganization(Boolean(resolved));
    });

    return () => {
      active = false;
    };
  }, [bootstrapped, organization, organizationSlug, resolveSlug]);

  return (
    <SessionGate>
      {!bootstrapped || resolving ? (
        <BootScreen />
      ) : !organization || !validOrganization ? (
        <Navigate to="/workspaces" />
      ) : (
        <AppShell>
          <Outlet />
        </AppShell>
      )}
    </SessionGate>
  );
}
