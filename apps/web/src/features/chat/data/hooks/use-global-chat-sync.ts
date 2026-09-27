import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";
import { MessageResponse } from "@/features/chat/types/messages/types";
import { DirectMessagePreview } from "@/features/chat/types/conversation/types";
import { Channel } from "@/features/chat/types/channel/types";
import { useGetChannels } from "../queries/channels/use-fetch-channels-hook";
import { useGetConversations } from "../queries/dm/use-fetch-conversations-hook";
import { useThreadStore } from "@/lib/store/ui-stores";
import { queryKeys } from "@/lib/queryKeys";

export function useGlobalChatSync(tenantId: string, token: string) {
  const queryClient = useQueryClient();
  const activeChatId = useThreadStore((s) => s.chatId);
  
  const { data: channels = [] } = useGetChannels(tenantId);
  useGetConversations(tenantId);

  // Stabilize channel IDs so the join-channels effect only re-runs when
  // the actual set of member channels changes — not on every render.
  const memberChannelIds = useMemo(
    () => channels.filter((c: Channel) => c.isMember).map((c: Channel) => c.id).sort().join(","),
    [channels]
  );

  // Keep activeChatId in a ref so socket handlers always read the latest
  // value without needing to be in the effect dependency array.
  const activeChatIdRef = useRef(activeChatId);

  useLayoutEffect(() => {
    activeChatIdRef.current = activeChatId;
  });

  // Join channel rooms — only when the set of member channels changes.
  useEffect(() => {
    if (!tenantId || !token || !memberChannelIds) return;

    const socket = getSocket(token, tenantId);
    const ids = memberChannelIds.split(",").filter(Boolean);
    ids.forEach((channelId) => {
      socket.emit("join-channel", { channelId });
    });
  }, [tenantId, token, memberChannelIds]);

  // Socket event listeners — stable deps only.
  useEffect(() => {
    if (!tenantId || !token) return;

    const socket = getSocket(token, tenantId);

    const channelMessageHandler = (message: MessageResponse) => {
      queryClient.setQueryData(
        queryKeys.chat.channels(tenantId),
        (old: Channel[] = []) =>
          old.map((c) =>
            c.id === message.channelId
              ? {
                  ...c,
                  lastMessage: message.message,
                  unreadCount: (message.channelId !== activeChatIdRef.current && message.message.id !== c.lastProcessedMessageId)
                    ? (c.unreadCount || 0) + 1
                    : c.unreadCount,
                  lastProcessedMessageId: message.message.id,
                }
              : c
          )
      );
    };

    const directMessageHandler = (message: MessageResponse) => {
      queryClient.setQueryData(
        queryKeys.chat.conversations(tenantId),
        (old: DirectMessagePreview[] = []) => {
          const conversationExists = old.some(c => 
            c.id === message.conversationId || c.otherMember.id === message.message.sender.id
          );

          if (!conversationExists) {
            queryClient.invalidateQueries({ queryKey: queryKeys.chat.conversations(tenantId) });
            return old;
          }

          return old.map((c) =>
            c.otherMember.id === message.message.sender.id || c.id === message.conversationId
              ? {
                  ...c,
                  content: message.message.content,
                  id: message.message.id, 
                  unreadCount: (message.message.sender.id !== activeChatIdRef.current) 
                    ? (c.unreadCount || 0) + 1 
                    : c.unreadCount,
                }
              : c
          );
        }
      );
    };

    socket.on("new-channel-message", channelMessageHandler);
    socket.on("new-direct-message", directMessageHandler);

    return () => {
      socket.off("new-channel-message", channelMessageHandler);
      socket.off("new-direct-message", directMessageHandler);
    };
  }, [tenantId, token, queryClient]);
}
