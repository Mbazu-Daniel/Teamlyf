import { useQuery } from "@tanstack/react-query";
import { getChannelMembers } from "../../chat-api";
import { queryKeys } from "@/lib/queryKeys";


export function useChannelMembers(tenantId: string, channelId: string, options = {}) {
  return useQuery({
    queryKey: queryKeys.chat.channelMembers(tenantId, channelId),
    queryFn: () => getChannelMembers(tenantId, channelId),
    enabled: !!tenantId && !!channelId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options
  });
}
