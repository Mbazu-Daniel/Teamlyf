import { createFileRoute } from "@tanstack/react-router";
import { AgentRuntimePage } from "@/features/agent-runtime";

export const Route = createFileRoute("/$organizationSlug/ai/$agentId")({
  component: AgentRuntimeRoute,
});

function AgentRuntimeRoute() {
  const { agentId } = Route.useParams();
  return <AgentRuntimePage agentId={agentId} />;
}
