import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ProjectTask } from "@/lib/api";
import { ProjectDetailPage, parseTaskSearch, useProjectPage } from "@/features/projects";
import { useOrganization } from "@/lib/organization";

export const Route = createFileRoute("/$organizationSlug/projects/$projectId/tasks")({
  validateSearch: parseTaskSearch,
  component: ProjectTasksRoute,
});

// fallow-ignore-next-line complexity -- route coordinates organization, project loading, view state and empty states
function ProjectTasksRoute() {
  const params = Route.useParams();
  const projectId = params.projectId;
  const organizationSlug = params.organizationSlug;
  const { task: selectedTaskId, view } = Route.useSearch();
  const { organization } = useOrganization();
  const state = useProjectPage(organization?.id, projectId);
  const navigate = useNavigate({ from: "/$organizationSlug/projects/$projectId/tasks" });
  const selectedTask = selectedTaskId
    ? state.tasks.find((task) => task.id === selectedTaskId)
    : undefined;

  const openTask = (task: ProjectTask) => {
    void navigate({ search: (prev) => ({ ...prev, task: task.id }) });
  };

  const closeTask = () => {
    void navigate({ search: (prev) => ({ ...prev, task: undefined }) });
  };

  const changeView = (next: "board" | "list") => {
    void navigate({ search: (prev) => ({ ...prev, view: next }) });
  };

  if (!organization) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-2xl font-semibold">Project</h1>
        <p className="mt-2 text-sm text-muted-foreground">Select an organization first.</p>
      </main>
    );
  }

  if (!state.project) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-sm text-muted-foreground">{state.error ?? "Loading project..."}</p>
      </main>
    );
  }

  return (
    <ProjectDetailPage
      project={state.project}
      state={state}
      organizationId={organization.id}
      organizationSlug={organizationSlug}
      selectedTaskId={selectedTask?.id ?? null}
      view={view ?? "board"}
      onViewChange={changeView}
      onSelectTask={openTask}
      onCloseTask={closeTask}
    />
  );
}
