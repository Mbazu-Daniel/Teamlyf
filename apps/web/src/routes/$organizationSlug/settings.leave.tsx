import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LeaveManagement } from "@/features/people/leave-management";
import { useOrganization } from "@/lib/organization";
import { settingsApi } from "@/lib/api";

export const Route = createFileRoute("/$organizationSlug/settings/leave")({
  component: LeaveSettingsRoute,
});

function LeaveSettingsRoute() {
  const { organization } = useOrganization();

  const members = useQuery({
    queryKey: ["settings", "leave-members", organization?.id ?? ""],
    queryFn: () => settingsApi.members(organization!.id),
    enabled: Boolean(organization),
    retry: false,
  });

  if (!organization)
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Select an organization before opening settings.
      </div>
    );

  if (members.isPending)
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Loading your team...
      </p>
    );

  return <LeaveManagement org={organization.id} members={members.data?.members ?? []} />;
}
