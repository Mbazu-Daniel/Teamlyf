import { createFileRoute, Outlet } from "@tanstack/react-router";
import { parseTaskSearch } from "@/features/projects";

export const Route = createFileRoute("/$organizationSlug/projects/$projectId")({
  validateSearch: parseTaskSearch,
  component: ProjectLayout,
});

/**
 * Project screens are children — `/tasks` for the board and list, `/settings`
 * for configuration. This route only hosts them, so the URL and the breadcrumb
 * agree on where the user is; it renders no chrome of its own.
 */
function ProjectLayout() {
  return <Outlet />;
}
