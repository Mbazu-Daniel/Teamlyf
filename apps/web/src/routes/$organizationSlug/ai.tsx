import { createFileRoute } from "@tanstack/react-router";
import { AgentsPage } from "@/features/agents";

export const Route = createFileRoute("/$organizationSlug/ai")({
  component: AgentsRoute,
});

function AgentsRoute() {
  return <AgentsPage />;
}
