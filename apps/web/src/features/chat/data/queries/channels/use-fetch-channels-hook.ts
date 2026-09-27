import { useQuery } from "@tanstack/react-query";
import { getChannels } from "../../chat-api";
import { queryKeys } from "@/lib/queryKeys";

export function useGetChannels(tenantId: string) {
  return useQuery({
    queryKey: queryKeys.chat.channels(tenantId),
    queryFn: async () => getChannels(tenantId),
    enabled: !!tenantId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}
