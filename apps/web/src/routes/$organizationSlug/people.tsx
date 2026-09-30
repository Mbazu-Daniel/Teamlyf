import { createFileRoute, redirect } from "@tanstack/react-router";
import { PeoplePage } from "@/features/people";

const HR_SECTIONS = ["departments", "leave", "org-chart"] as const;

const FORWARDED_SECTIONS = ["members", "employees"];

export const Route = createFileRoute("/$organizationSlug/people")({
  validateSearch: (search: Record<string, unknown>): { section?: string; member?: string } => {
    const requested = String(search.section);
    return {
      section: (HR_SECTIONS as readonly string[]).includes(requested) ? requested : "departments",
      member: typeof search.member === "string" ? search.member : undefined,
    };
  },
  beforeLoad: ({ search, params }) => {
    // Members has its own route, so old /people?section=members links forward.
    if (FORWARDED_SECTIONS.includes(String(search.section))) {
      throw redirect({
        to: "/$organizationSlug/members",
        params: { organizationSlug: params.organizationSlug },
        search: { member: typeof search.member === "string" ? search.member : undefined },
      });
    }
  },
  component: PeopleRoute,
});

function PeopleRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <PeoplePage
      section={search.section ?? "departments"}
      selectedMember={search.member}
      onNavigate={(section, member) => {
        void navigate({ search: { section, member } });
      }}
    />
  );
}
