import { createFileRoute } from "@tanstack/react-router";
import { SecuritySettingsPage } from "@/features/settings/security";
import { useOrganization } from "@/lib/organization";

export const Route = createFileRoute("/$organizationSlug/settings/security")({
  component: SecuritySettingsRoute,
});

function SecuritySettingsRoute() {
  const { organization } = useOrganization();
  return <SecuritySettingsPage organizationId={organization?.id} />;
}
