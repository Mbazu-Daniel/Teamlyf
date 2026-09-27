// hooks/chat/useThreadMessages.ts
import { useQuery } from "@tanstack/react-query";
import { getChannelThreadMessages, getDirectThreadMessages } from "../chat-api";
import { queryKeys } from "@/lib/queryKeys";

export function useThreadMessages(tenantId: string, chatId: string, parentMessageId: string, event: "channel" | "direct") {
  return useQuery({
    queryKey: queryKeys.chat.threadMessages(event, chatId, parentMessageId),
    queryFn: async () => event === 'channel' ? getChannelThreadMessages(tenantId, chatId, parentMessageId) : getDirectThreadMessages(tenantId, chatId, parentMessageId),
    enabled: !!tenantId && !!parentMessageId && !!chatId && !!event,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}