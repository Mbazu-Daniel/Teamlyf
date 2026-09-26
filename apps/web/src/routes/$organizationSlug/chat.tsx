import { createFileRoute } from "@tanstack/react-router";
import { ChatPage } from "@/features/chat/chat-page";

export const Route = createFileRoute("/$organizationSlug/chat")({
  component: ChatRoute,
});

function ChatRoute() {
  return <ChatPage />;
}
