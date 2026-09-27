import { useQuery } from "@tanstack/react-query";
import { getUnifiedThreads } from "../chat-api";
import { queryKeys } from "@/lib/queryKeys";

export function useFetchThreads(tenantId: string, page: number = 1, limit: number = 50) {
    return useQuery({
        queryKey: [...queryKeys.chat.threads(tenantId), page, limit] as const,
        queryFn: () => getUnifiedThreads(tenantId, page, limit),
        enabled: !!tenantId,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchIntervalInBackground: false, // Disable polling when tab is hidden
    });
}
