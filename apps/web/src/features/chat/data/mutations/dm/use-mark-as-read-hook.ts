import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markConversationAsRead } from "../../chat-api";
import { DirectMessagePreview } from "@/features/chat/types/conversation/types";
import { queryKeys } from "@/lib/queryKeys";

export function useMarkConversationAsRead(tenantId: string, conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      return markConversationAsRead(tenantId, conversationId);
    },
    onSuccess: (_data, conversationIdArg) => {
      const partnerId = conversationIdArg || conversationId;
      queryClient.setQueryData(
        queryKeys.chat.conversations(tenantId),
        (old: DirectMessagePreview[] = []) =>
          old.map((c) =>
            c.otherMember.id === partnerId || c.id === partnerId
              ? {
                  ...c,
                  unreadCount: 0,
                }
              : c,
          ),
      );
    },
  });
}
