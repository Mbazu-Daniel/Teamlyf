import { createFileRoute, Navigate } from "@tanstack/react-router";
import { parseTaskSearch } from "@/features/projects";

export const Route = createFileRoute("/$organizationSlug/projects/$projectId/")({
  validateSearch: parseTaskSearch,
  component: ProjectIndex,
});

/**
 * A project opens on its tasks. The bare URL forwards to `/tasks` so the
 * breadcrumb reads `Projects / <project> / Tasks` and every deep link
 * (`?task=`, `?view=`) survives the hop.
 */
function ProjectIndex() {
  const { organizationSlug, projectId } = Route.useParams();
  const { task, view } = Route.useSearch();

  return (
    <Navigate
      to="/$organizationSlug/projects/$projectId/tasks"
      params={{ organizationSlug, projectId }}
      search={{ task, view }}
      replace
    />
  );
}
