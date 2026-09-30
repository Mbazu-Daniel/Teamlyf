import { createFileRoute } from "@tanstack/react-router";
import { SprintsPage } from "@/features/projects/sprints";
import { useOrganization } from "@/lib/organization";

export const Route = createFileRoute("/$organizationSlug/projects/$projectId/sprints")({
  component: ProjectSprintsRoute,
});

function ProjectSprintsRoute() {
  const { projectId, organizationSlug } = Route.useParams();
  const { organization } = useOrganization();

  if (!organization) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-2xl font-semibold">Sprints</h1>
        <p className="mt-2 text-sm text-muted-foreground">Select an organization first.</p>
      </main>
    );
  }

  return (
    <SprintsPage
      key={`${organization.id}:${projectId}`}
      organizationId={organization.id}
      projectSlug={projectId}
      organizationSlug={organizationSlug}
    />
  );
}
