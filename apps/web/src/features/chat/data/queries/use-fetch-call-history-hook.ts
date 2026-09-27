import { useQuery } from "@tanstack/react-query";
import { getCallHistory, getMissedCalls } from "../calls-api";
import { queryKeys } from "@/lib/queryKeys";

export function useFetchCallHistory(tenantId: string) {
    return useQuery({
        queryKey: queryKeys.chat.callHistory(tenantId),
        queryFn: () => getCallHistory(tenantId),
        enabled: !!tenantId,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchIntervalInBackground: false, // Disable polling when tab is hidden
    });
}

export function useFetchMissedCalls(tenantId: string) {
    return useQuery({
        queryKey: queryKeys.chat.missedCalls(tenantId),
        queryFn: () => getMissedCalls(tenantId),
        enabled: !!tenantId,
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchIntervalInBackground: false, // Disable polling when tab is hidden
    });
}
