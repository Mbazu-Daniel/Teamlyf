import { createFileRoute, Outlet } from "@tanstack/react-router";
import { parseTaskSearch } from "@/features/projects";

export const Route = createFileRoute("/$organizationSlug/projects/$projectId")({
  validateSearch: parseTaskSearch,
  component: ProjectLayout,
});

function ProjectLayout() {
  return <Outlet />;
}
