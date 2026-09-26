import { createFileRoute } from "@tanstack/react-router";
import { TasksPage } from "@/features/projects/tasks-page";

export const Route = createFileRoute("/$organizationSlug/tasks")({
  component: TasksRoute,
});

function TasksRoute() {
  const { organizationSlug } = Route.useParams();
  return <TasksPage organizationSlug={organizationSlug} />;
}
