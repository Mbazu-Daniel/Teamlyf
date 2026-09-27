import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/api/client";
import { queryKeys } from "@/lib/queryKeys";
import type { TenantMember } from "@/features/chat/types/tenant-members/types";

interface UseFetchTenantMembersOptions {
  enabled?: boolean;
}

interface PaginatedMembers {
  records: TenantMember[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export const useFetchTenantMembers = (tenantId: string, options?: UseFetchTenantMembersOptions) => {
  return useQuery({
    queryKey: queryKeys.tenantMembers.list(tenantId),
    queryFn: () =>
      client.request<PaginatedMembers>(`/organization/${tenantId}/chat/members`, {
        query: { page: 1, limit: 100 },
      }),
    enabled: !!tenantId && (options?.enabled ?? true),
    staleTime: 1000 * 60 * 15,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
};
