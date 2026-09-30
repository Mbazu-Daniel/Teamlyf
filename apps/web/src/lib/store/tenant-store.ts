import { useMemo } from "react";
import { useOrganization } from "@/lib/organization";

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
