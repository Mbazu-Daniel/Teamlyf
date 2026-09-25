import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ProjectTask } from "@/lib/api";
import { ProjectDetailPage, parseTaskSearch, useProjectPage } from "@/features/projects";
import { useOrganization } from "@/lib/organization";

export const Route = createFileRoute("/$organizationSlug/projects/$projectId")({
  validateSearch: parseTaskSearch,
  component: ProjectRoute,
});

function ProjectRoute() {
  const { projectId } = Route.useParams();
  const { task: selectedTaskId } = Route.useSearch();
  const { organization } = useOrganization();
  const state = useProjectPage(organization?.id, projectId);
  const navigate = useNavigate({ from: "/$organizationSlug/projects/$projectId" });

  const openTask = (task: ProjectTask) => {
    void navigate({ search: (prev) => ({ ...prev, task: task.id }) });
  };

  const closeTask = () => {
    void navigate({ search: (prev) => ({ ...prev, task: undefined }) });
  };

  return (
    <ProjectRouteContent
      organization={organization}
      state={state}
      selectedTaskId={selectedTaskId ?? null}
      openTask={openTask}
      closeTask={closeTask}
    />
  );
}

function ProjectRouteContent({
  organization,
  state,
  selectedTaskId,
  openTask,
  closeTask,
}: {
  organization: ReturnType<typeof useOrganization>["organization"];
  state: ReturnType<typeof useProjectPage>;
  selectedTaskId: string | null;
  openTask: (task: ProjectTask) => void;
  closeTask: () => void;
}) {
  if (!organization) return <main className="mx-auto max-w-6xl px-6 py-12"><h1 className="text-2xl font-semibold">Project</h1><p className="mt-2 text-muted-foreground">Select an organization first.</p></main>;
  if (!state.project) return <main className="mx-auto max-w-6xl px-6 py-12"><p className="text-sm text-muted-foreground">{state.error ?? "Loading project..."}</p></main>;

  return (
    <ProjectDetailPage
      project={state.project}
      state={state}
      organizationId={organization.id}
      selectedTaskId={selectedTaskId}
      onSelectTask={openTask}
      onCloseTask={closeTask}
    />
  );
}
