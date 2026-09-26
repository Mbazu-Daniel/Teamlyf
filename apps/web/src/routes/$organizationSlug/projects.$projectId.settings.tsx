import { createFileRoute } from "@tanstack/react-router";
import { ProjectSettings } from "@/features/projects/project-settings";
import { useProjectPage } from "@/features/projects";
import { useOrganization } from "@/lib/organization";

export const Route = createFileRoute("/$organizationSlug/projects/$projectId/settings")({ component: ProjectSettingsRoute });

// fallow-ignore-next-line complexity -- route coordinates organization, project loading, and empty states
function ProjectSettingsRoute() {
  const { organizationSlug, projectId } = Route.useParams();
  const { organization } = useOrganization();
  const state = useProjectPage(organization?.id, projectId);

  if (!organization) return <main className="p-8 text-sm text-muted-foreground">Select an organization first.</main>;
  if (!state.project) return <main className="p-8 text-sm text-muted-foreground">{state.error ?? "Loading project..."}</main>;

  return <ProjectSettings project={state.project} organizationId={organization.id} organizationSlug={organizationSlug} />;
}
