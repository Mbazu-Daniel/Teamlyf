import { createFileRoute } from "@tanstack/react-router";
import { PeoplePage } from "@/features/people";

export const Route = createFileRoute("/$organizationSlug/people")({
  component: PeopleRoute,
});

function PeopleRoute() {
  const { organizationSlug } = Route.useParams();
  return <PeoplePage organizationSlug={organizationSlug} />;
}
