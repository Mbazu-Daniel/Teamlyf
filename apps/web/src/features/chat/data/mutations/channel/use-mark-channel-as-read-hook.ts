import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markChannelAsRead } from "../../chat-api";
import { Channel } from "@/features/chat/types/channel/types";
import { queryKeys } from "@/lib/queryKeys";

export function useMarkChannelAsRead(tenantId: string, channelId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (channelId: string) => {
      return markChannelAsRead(tenantId, channelId);
    },
    onSuccess: () => {
      // Optionally invalidate conversations to update read status
      queryClient.setQueryData(
          queryKeys.chat.channels(tenantId),
          (old: Channel[] = []) =>
            old.map((c) =>
              c.id === channelId
                ? {
                    ...c,
                    unreadCount: 0,
                  }
                : c
            )
        );
    },
  });
}