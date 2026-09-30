import { useInfiniteQuery } from "@tanstack/react-query";
import { getMessages } from "../../chat-api";
import { Message } from "@/features/chat/types/messages/types";
import { queryKeys } from "@/lib/queryKeys";
import { DEFAULT_MESSAGE_LIMIT } from "../../message-query-cache";

export function useMessages(
  tenantId: string,
  chatId: string,
  limit: number = DEFAULT_MESSAGE_LIMIT,
  options = {},
) {
  return useInfiniteQuery({
    queryKey: queryKeys.chat.directMessages(tenantId, chatId, limit),
    queryFn: async ({ pageParam }) => {
      const data = await getMessages(tenantId, chatId, {
        limit,
        before: typeof pageParam === "string" ? pageParam : undefined,
      });
      data.messages = data.messages.sort(
        (a: Message, b: Message) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      return data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.hasMore && lastPage.nextCursor) {
        return lastPage.nextCursor;
      }
      return undefined;
    },
    initialPageParam: undefined as string | undefined,
    staleTime: 1000 * 60 * 5, // 5 minutes since WebSocket handles real-time
    refetchOnWindowFocus: false,
    refetchOnMount: false, // WebSocket will update
    refetchOnReconnect: true,
    refetchInterval: false, // Disable polling, rely on WebSocket
    ...options,
  });
}
