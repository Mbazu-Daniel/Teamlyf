import { createFileRoute } from "@tanstack/react-router";
import { useParams } from "@tanstack/react-router";


import { parseEntityId } from "@/lib/utils/parse-entity-id";
import { Suspense, useEffect } from "react";
import { useNavigationStore, useThreadStore } from "@/lib/store/ui-stores";
import { DirectChatContent } from "@/features/chat/dms/direct-chat-content";

function RouteComponent() {
  const params = useParams({ strict: false }) as { chatId: string };
  const chatId = parseEntityId(params.chatId);
  const setCurrentPage = useNavigationStore((state) => state.setCurrentPage);
  const setChatId = useThreadStore((state) => state.setChatId);

  useEffect(() => {
    setCurrentPage("Chats");
    if (chatId) {
      setChatId(chatId);
    }
  }, [setCurrentPage, setChatId, chatId]);

  if (!chatId) {
    return null;
  }

  return (
    <div className="bg-chat-primary-bg h-full">
      <Suspense fallback={<div className="h-full w-full bg-chat-primary-bg animate-pulse" />}>
        <DirectChatContent chatId={chatId} />
      </Suspense>
    </div>
  );
}


export const Route = createFileRoute('/$organizationSlug/chats/dm/$chatId')({
  component: RouteComponent,
});
