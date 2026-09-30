import { createFileRoute } from "@tanstack/react-router";
import { MembersPage } from "@/features/people";

// `member` keeps a person selected so shared profile deep links still land.
export const Route = createFileRoute("/$organizationSlug/members")({
  validateSearch: (search: Record<string, unknown>): { member?: string } => ({
    member: typeof search.member === "string" ? search.member : undefined,
  }),
  component: MembersRoute,
});

function MembersRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <MembersPage
      selectedMember={search.member}
      onSelectMember={(member) => {
        void navigate({ search: { member } });
      }}
    />
  );
}
