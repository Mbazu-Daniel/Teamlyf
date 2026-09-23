import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Organization } from "./api";

type OrganizationContextValue = {
  organization: Organization | null;
  selectOrganization: (organization: Organization) => void;
};

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const value = useMemo(() => ({ organization, selectOrganization: setOrganization }), [organization]);
  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) throw new Error("useOrganization must be used inside OrganizationProvider");
  return context;
}
