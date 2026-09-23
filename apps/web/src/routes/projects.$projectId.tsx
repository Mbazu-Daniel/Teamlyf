import { createFileRoute } from "@tanstack/react-router";
import { ProjectDetailPage, useProjectPage } from "@/features/projects";
import { useOrganization } from "@/lib/organization";

export const Route = createFileRoute("/projects/$projectId")({ component: ProjectRoute });

function ProjectRoute() {
  const { projectId } = Route.useParams();
  const { organization } = useOrganization();
  const state = useProjectPage(organization?.id, projectId);

  if (!organization) {
    return <main className="mx-auto max-w-6xl px-6 py-12"><h1 className="text-2xl font-semibold">Project</h1><p className="mt-2 text-muted-foreground">Select an organization first.</p></main>;
  }

  if (!state.project) {
    return <main className="mx-auto max-w-6xl px-6 py-12"><p className="text-sm text-muted-foreground">{state.error ?? "Loading project..."}</p></main>;
  }

  return <ProjectDetailPage project={state.project} state={state} />;
}
