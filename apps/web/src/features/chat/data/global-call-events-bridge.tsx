import type { ReactNode } from "react";
import { GlobalCallEventsProvider } from "@/features/chat/data/hooks/use-global-call-events";
import { useFetchTenantMembers } from "@/features/chat/data/queries/use-fetch-tenant-members-hook";
import { useOrganization } from "@/lib/organization";
import { useAuthStore } from "@/lib/store/auth-store";

/**
 * Mounts GlobalCallEventsProvider at the app root so incoming-call events are
 * received on every route, with the current member resolved once and reused.
 */
export function GlobalCallEventsBridge({ children }: { children: ReactNode }) {
  const tenantId = useOrganization().organization?.id ?? "";
  const user = useAuthStore((s) => s.user);
  const { data: members } = useFetchTenantMembers(tenantId);
  const myMemberId = members?.records?.find((m) => String(m.userId) === String(user?.id))?.id;

  return (
    <GlobalCallEventsProvider tenantId={tenantId} myMemberId={myMemberId ?? ""}>
      {children}
    </GlobalCallEventsProvider>
  );
}
