import { useQuery } from "@tanstack/react-query";
import { getConversations } from "../../chat-api";
import { queryKeys } from "@/lib/queryKeys";

export function useGetConversations(tenantId: string) {
  return useQuery({
    queryKey: queryKeys.chat.conversations(tenantId),
    queryFn: async () => getConversations(tenantId),
    enabled: !!tenantId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}
