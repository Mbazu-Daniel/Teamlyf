import { useQuery } from "@tanstack/react-query";
import { getMentions } from "../chat-api";
import { queryKeys } from "@/lib/queryKeys";

export function useFetchMentions(tenantId: string | null, memberId: string | null) {
  return useQuery({
    queryKey: [...queryKeys.chat.mentions(tenantId!), memberId!] as const,
    queryFn: () => {
      if (!tenantId || !memberId) throw new Error("tenantId and memberId are required");
      return getMentions(tenantId, memberId);
    },
    enabled: !!tenantId && !!memberId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
  });
}
