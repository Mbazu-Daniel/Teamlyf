import { useQuery } from "@tanstack/react-query";
import api from "@/features/chat/data/http";
import { MessageReaction } from "@/features/chat/types/messages/types";
import { queryKeys } from "@/lib/queryKeys";

export function useMessageReactions(
  tenantId: string,
  chatId: string,
  messageId: string,
  type: "channel" | "direct"
) {
  return useQuery({
    queryKey: queryKeys.chat.messageReactions(tenantId, chatId, messageId),
    queryFn: async () => {
      // The backend endpoint might only be for channels right now based on the prompt, 
      // but assuming consistent routing or we adjust as needed.
      const url = `/organization/${tenantId}/message-reactions/by-message?messageId=${messageId}&messageType=${type}`;
        
      const response = await api.get(url);
      return response.data as MessageReaction[];
    },
    // We only want to fetch if we have the IDs and it's not a temp ID
    enabled: !!tenantId && !!chatId && !!messageId && !String(messageId).startsWith("temp-"),
    // Add some caching time to prevent spamming the endpoint
    staleTime: 60 * 1000,
  });
}
