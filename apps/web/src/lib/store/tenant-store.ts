import { useMemo } from "react";
import { useOrganization } from "@/lib/organization";

/**
 * Chat feature view over the active organization.
 *
 * `tenantId` is the organization id — chat routes are org-scoped, and the
 * feature's REST paths are `/organization/:orgId/...`.
 */
interface TenantState {
  tenantId: string | null;
  subdomain: string | null;
}

export function useTenantStore(): TenantState;
export function useTenantStore<T>(selector: (state: TenantState) => T): T;
export function useTenantStore<T>(selector?: (state: TenantState) => T): TenantState | T {
  const { organization } = useOrganization();

  const state = useMemo<TenantState>(
    () => ({
      tenantId: organization?.id ?? null,
      subdomain: organization?.slug ?? organization?.id ?? null,
    }),
    [organization],
  );

  return selector ? selector(state) : state;
}
