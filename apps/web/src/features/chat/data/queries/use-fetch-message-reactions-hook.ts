import { useQuery } from "@tanstack/react-query";
import api from "@/features/chat/data/http";
import { MessageReaction } from "@/features/chat/types/messages/types";
import { queryKeys } from "@/lib/queryKeys";

export function useMessageReactions(
  tenantId: string,
  chatId: string,
  messageId: string,
  type: "channel" | "direct",
) {
  return useQuery({
    queryKey: queryKeys.chat.messageReactions(tenantId, chatId, messageId),
    queryFn: async () => {
      const url = `/organization/${tenantId}/message-reactions/by-message?messageId=${messageId}&messageType=${type}`;

      const response = await api.get(url);
      return response.data as MessageReaction[];
    },

    enabled: !!tenantId && !!chatId && !!messageId && !String(messageId).startsWith("temp-"),

    staleTime: 60 * 1000,
  });
}
