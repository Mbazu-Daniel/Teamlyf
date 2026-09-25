import { createFileRoute } from "@tanstack/react-router";
import { OrganizationSettingsPage, useOrganizationSettings } from "@/features/settings";
import { useOrganization } from "@/lib/organization";

export const Route = createFileRoute("/$organizationSlug/settings/organization")({ component: OrganizationSettingsRoute });

function OrganizationSettingsRoute() {
  const { organization, selectOrganization } = useOrganization();
  const state = useOrganizationSettings(organization, selectOrganization);

  if (!organization) return <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">Select an organization before opening settings.</div>;
  return <OrganizationSettingsPage state={state} />;
}
