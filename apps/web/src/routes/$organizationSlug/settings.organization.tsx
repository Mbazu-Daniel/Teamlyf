import { WorkspaceDanger } from "@/features/settings/workspace-danger";
import { createFileRoute } from "@tanstack/react-router";
import { OrganizationSettingsPage, useOrganizationSettings } from "@/features/settings";
import { useOrganization } from "@/lib/organization";
import { InvitationManagement } from "@/features/settings/invitations";

export const Route = createFileRoute("/$organizationSlug/settings/organization")({
  component: OrganizationSettingsRoute,
});

function OrganizationSettingsRoute() {
  const { organization, selectOrganization } = useOrganization();
  const state = useOrganizationSettings(organization, selectOrganization);

  if (!organization)
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Select an organization before opening settings.
      </div>
    );
  return (
    <div className="space-y-6">
      <OrganizationSettingsPage state={state} />
      <InvitationManagement org={organization.id} />
      <WorkspaceDanger />
    </div>
  );
}
