import { createFileRoute } from "@tanstack/react-router";
import { EpicsPage } from "@/features/projects/epics";
import { useOrganization } from "@/lib/organization";

export const Route = createFileRoute("/$organizationSlug/projects/$projectId/epics")({
  component: ProjectEpicsRoute,
});

function ProjectEpicsRoute() {
  const { projectId, organizationSlug } = Route.useParams();
  const { organization } = useOrganization();

  if (!organization) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-2xl font-semibold">Modules</h1>
        <p className="mt-2 text-sm text-muted-foreground">Select an organization first.</p>
      </main>
    );
  }

  return (
    <EpicsPage
      key={`${organization.id}:${projectId}`}
      organizationId={organization.id}
      projectSlug={projectId}
      organizationSlug={organizationSlug}
    />
  );
}
