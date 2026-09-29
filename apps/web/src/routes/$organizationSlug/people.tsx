import { createFileRoute } from "@tanstack/react-router";
import { PeoplePage } from "@/features/people";

export const Route = createFileRoute("/$organizationSlug/people")({
  validateSearch: (search: Record<string, unknown>): { section?: string; member?: string } => ({ section: ["employees", "departments", "leave", "org-chart"].includes(String(search.section)) ? String(search.section) : "employees", member: typeof search.member === "string" ? search.member : undefined }),
  component: PeopleRoute,
});

function PeopleRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return <PeoplePage section={search.section ?? "employees"} selectedMember={search.member} onNavigate={(section, member) => { void navigate({ search: { section, member } }); }} />;
}
