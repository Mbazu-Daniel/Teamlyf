import { createFileRoute } from "@tanstack/react-router";
import { useOrganization } from "@/lib/organization";
import { ChatPage } from "@/features/chat/chat-page";

export const Route = createFileRoute("/$organizationSlug/chat")({
  component: ChatRoute,
});

function ChatRoute() {
  const { organization } = useOrganization();
  if (!organization) return null;
  return <ChatPage organization={organization} />;
}
