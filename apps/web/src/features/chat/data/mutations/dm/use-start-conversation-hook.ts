import { useAppRouter } from "@/lib/navigation";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/features/chat/data/http";
import { logger } from "@/lib/utils/logger";
import { queryKeys } from "@/lib/queryKeys";

interface StartConversationPayload {
  recipientId: string;
  content: string;
}

export function useStartConversation(tenantId: string, subdomain: string) {
  const router = useAppRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: StartConversationPayload) => {
      const res = await api.post(`/organization/${tenantId}/direct-messages`, {
        recipientId: payload.recipientId,
        content: payload.content,
      });

      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chat.conversations(tenantId) });

      const chatId = data?.message?.conversationId;
      if (chatId) {
        router.push(`/${subdomain}/chats/dm/${chatId}`);
      } else {
        logger.error("Could not determine chatId from response:", data);
      }
    },
  });
}
