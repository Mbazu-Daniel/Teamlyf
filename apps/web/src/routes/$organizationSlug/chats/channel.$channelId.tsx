import { createFileRoute } from "@tanstack/react-router";
import { useParams } from "@tanstack/react-router";


import { parseEntityId } from "@/lib/utils/parse-entity-id";
import { Suspense, useEffect } from "react";
import { useNavigationStore, useThreadStore } from "@/lib/store/ui-stores";
import { ChannelChatContent } from "@/features/chat/channels/channel-chat-content";

function RouteComponent() {
  const params = useParams({ strict: false }) as { channelId: string };
  const channelId = parseEntityId(params.channelId);
  const setCurrentPage = useNavigationStore((s) => s.setCurrentPage);
  const setChatId = useThreadStore((s) => s.setChatId);

  useEffect(() => {
    setCurrentPage("Chats");
    if (channelId) {
      setChatId(channelId);
    }
  }, [setCurrentPage, setChatId, channelId]);

  if (!channelId) {
    return null;
  }

  return (
    <div className="bg-chat-primary-bg h-full">
      <Suspense fallback={<div className="h-full w-full bg-chat-primary-bg animate-pulse" />}>
        <ChannelChatContent channelId={channelId} />
      </Suspense>
    </div>
  );
}


export const Route = createFileRoute('/$organizationSlug/chats/channel/$channelId')({
  component: RouteComponent,
});
