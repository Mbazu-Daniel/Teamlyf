import { createFileRoute } from "@tanstack/react-router";
import { ProfileSettings } from "@/features/settings/profile";
import { useOrganization } from "@/lib/organization";

export const Route = createFileRoute("/$organizationSlug/settings/profile")({
  component: ProfileSettingsRoute,
});

function ProfileSettingsRoute() {
  const { organization } = useOrganization();
  if (!organization) return null;
  return <ProfileSettings organizationId={organization.id} />;
}
