import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { client, getOrganizations, type Organization } from "./api";
import { useSession } from "./session";

const ORG_STORAGE_PREFIX = "teamlyf:last-organization-id:";

function organizationStorageKey(userId: string) {
  return `${ORG_STORAGE_PREFIX}${userId}`;
}

type OrganizationContextValue = {
  organization: Organization | null;
  organizations: Organization[];
  /** False until the persisted organization has been restored (or confirmed absent). */
  bootstrapped: boolean;
  selectOrganization: (organization: Organization) => void;
  refreshOrganizations: () => Promise<Organization[]>;
  resolveSlug: (slug: string) => Promise<Organization | null>;
  /** Forget the workspace in memory and on disk. Called on sign out so a
   * different account never inherits the previous one's workspace. */
  reset: () => void;
};

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

function organizationSlug(organization: Organization) {
  return organization.slug?.trim() || organization.id;
}

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    const savedId = localStorage.getItem(ORG_STORAGE_KEY);
    if (!savedId) {
      setBootstrapped(true);
      return;
    }
    let active = true;
    client
      .request<Organization>(`/organization/${savedId}`)
      .then((saved) => {
        if (active) setOrganization(saved);
      })
      .catch(() => localStorage.removeItem(ORG_STORAGE_KEY))
      .finally(() => {
        if (active) setBootstrapped(true);
      });
    return () => {
      active = false;
    };
  }, [session, sessionPending]);

  const value = useMemo<OrganizationContextValue>(
    () => ({
      organization,
      organizations,
      bootstrapped,
      selectOrganization: (next) => {
        const userId = session?.user?.id;\n        if (userId) localStorage.setItem(organizationStorageKey(userId), next.id);
        setOrganization(next);
        setOrganizations((current) => {
          const exists = current.some((item) => item.id === next.id);
          return exists ? current.map((item) => (item.id === next.id ? next : item)) : [next, ...current];
        });
      },
      refreshOrganizations: async () => {
        const next = await getOrganizations();
        setOrganizations(next);
        return next;
      },
      resolveSlug: async (slug) => {
        const next = await getOrganizations();
        setOrganizations(next);
        const match = next.find((item) => organizationSlug(item) === slug || item.id === slug) ?? null;
        if (match) {
          const userId = session?.user?.id;\n          if (userId) localStorage.setItem(organizationStorageKey(userId), match.id);
          setOrganization(match);
        }
        return match;
      },
      reset: () => {
        localStorage.removeItem(ORG_STORAGE_KEY);
        setOrganization(null);
        setOrganizations([]);
      },
    }),
    [organization, organizations, bootstrapped, session?.user?.id],
  );

  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) throw new Error("useOrganization must be used inside OrganizationProvider");
  return context;
}

