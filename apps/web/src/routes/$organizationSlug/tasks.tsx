import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { parseTaskSearch } from "@/features/projects";
import { TasksPage } from "@/features/projects/tasks-page";
import { useOrganization } from "@/lib/organization";

export const Route = createFileRoute("/$organizationSlug/tasks")({
  validateSearch: parseTaskSearch,
  component: TasksRoute,
});

function TasksRoute() {
  const { task, view } = Route.useSearch();
  const { organization } = useOrganization();
  const navigate = useNavigate({ from: "/$organizationSlug/tasks" });

  return (
    <TasksPage
      organizationId={organization?.id}
      view={view ?? "board"}
      onViewChange={(next) => void navigate({ search: (prev) => ({ ...prev, view: next }) })}
      selectedTaskId={task ?? null}
      onSelectTask={(next) => void navigate({ search: (prev) => ({ ...prev, task: next.id }) })}
      onCloseTask={() => void navigate({ search: (prev) => ({ ...prev, task: undefined }) })}
    />
  );
}
