import { useCallback } from "react";
import { getSocket } from "@/lib/socket";
import { useQueryClient } from "@tanstack/react-query";
import { MessageReaction } from "@/features/chat/types/messages/types";
import { queryKeys } from "@/lib/queryKeys";
import {
  mapMessagesInInfiniteData,
  patchMessagesInInfiniteCaches,
} from "../message-query-cache";

export function useReactions(
  tenantId: string,
  token: string,
  type: "channel" | "direct",
  chatId: string,
  currentMemberId?: string
) {
  const socket = getSocket(token, tenantId);
  const queryClient = useQueryClient();

  const handleOptimisticUpdate = useCallback(
    (messageId: string, reaction: string, isAdd: boolean) => {
      if (!currentMemberId || !chatId) return;

      const prefix =
        type === "channel"
          ? queryKeys.chat.channelMessages(tenantId, chatId)
          : queryKeys.chat.directMessages(tenantId, chatId);

      const reactionCacheKey = queryKeys.chat.messageReactions(tenantId, chatId, messageId);

      queryClient.setQueryData(reactionCacheKey, (oldReactions: MessageReaction[] = []) => {
        let newReactions = [...oldReactions];
        if (isAdd) {
          if (!newReactions.some(r => r.reaction === reaction && r.tenantMemberId === currentMemberId)) {
            newReactions.push({ reaction, tenantMemberId: currentMemberId });
          }
        } else {
          newReactions = newReactions.filter(r => !(r.reaction === reaction && r.tenantMemberId === currentMemberId));
        }
        return newReactions;
      });

      patchMessagesInInfiniteCaches(queryClient, prefix, (old) =>
        mapMessagesInInfiniteData(old, (m) => {
          if (m.id !== messageId) return m;
          const currentReactions = m.reactions || [];
          let newReactions = [...currentReactions];
          if (isAdd) {
            if (!newReactions.some(r => r.reaction === reaction && r.tenantMemberId === currentMemberId)) {
              newReactions.push({ reaction, tenantMemberId: currentMemberId });
            }
          } else {
            newReactions = newReactions.filter(r => !(r.reaction === reaction && r.tenantMemberId === currentMemberId));
          }
          return { ...m, reactions: newReactions };
        }),
      );
    },
    [currentMemberId, chatId, tenantId, type, queryClient]
  );


  const addReaction = useCallback(
    (messageId: string, reaction: string) => {
      handleOptimisticUpdate(messageId, reaction, true);

      socket.emit("add-reaction", {
        messageId,
        messageType: type,
        reaction,
      });
    },
    [socket, type, handleOptimisticUpdate]
  );

  const removeReaction = useCallback(
    (messageId: string, reaction: string) => {
      handleOptimisticUpdate(messageId, reaction, false);

      socket.emit("remove-reaction", {
        messageId,
        messageType: type,
        reaction,
      });
    },
    [socket, type, handleOptimisticUpdate]
  );

  return { addReaction, removeReaction };
}
