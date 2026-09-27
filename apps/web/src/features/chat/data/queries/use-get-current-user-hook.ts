import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/api/client";
import { queryKeys } from "@/lib/queryKeys";
import type { TenantMember } from "@/features/chat/types/tenant-members/types";

/** The signed-in user's own membership record for the active organization. */
export function useGetCurrentUser(tenantId: string | null) {
  return useQuery<TenantMember>({
    queryKey: queryKeys.user.current(tenantId ?? ""),
    queryFn: async () => {
      if (!tenantId) throw new Error("tenantId is required");
      return client.request<TenantMember>(`/organization/${tenantId}/chat/members/me`);
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}
