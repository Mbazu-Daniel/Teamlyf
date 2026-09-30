import { createFileRoute } from "@tanstack/react-router";
import { AccessSettingsContent, useAccessSettings } from "@/features/settings/access";
import { useOrganization } from "@/lib/organization";
import { RoleEditor } from "@/features/settings/role-editor";

export const Route = createFileRoute("/$organizationSlug/settings/access")({
  component: AccessSettingsRoute,
});

function AccessSettingsRoute() {
  const { organization } = useOrganization();
  const state = useAccessSettings(organization?.id);

  if (!organization)
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Select an organization before opening settings.
      </div>
    );
  return (
    <div className="space-y-6">
      <AccessSettingsContent state={state} />
      <RoleEditor org={organization.id} />
    </div>
  );
}
