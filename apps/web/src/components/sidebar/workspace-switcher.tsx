import { useLocation, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { IconCheck, IconPlus, IconSelector } from "@tabler/icons-react";
import { getOrganizations, type Organization } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { useOrganization } from "@/lib/organization";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { cn } from "@/lib/utils";

function organizationInitial(name: string) {
  return name.slice(0, 1).toUpperCase();
}

type WorkspaceSwitcherProps = Readonly<{ collapsed: boolean }>;

/**
 * Shows the active organization and lists the member's other organizations.
 * Picking one persists it for the signed-in user, and OrganizationProvider restores
 * it on the next login without forcing the organization picker again.
 */
export function WorkspaceSwitcher({ collapsed }: WorkspaceSwitcherProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const { organization, selectOrganization } = useOrganization();
  const { data: organizations, isPending } = useQuery({
    queryKey: queryKeys.organizations,
    queryFn: getOrganizations,
    staleTime: 30_000,
  });

  // The shell only mounts once a organization exists; the guard keeps this honest.
  // Bound once so `choose` and the trigger read a narrowed organization, not the union.
  if (!organization) return null;
  const activeOrganization = organization;

  function choose(next: Organization) {
    if (next.id === activeOrganization.id) return;
    selectOrganization(next);
    // Every cached resource is keyed by organization id, so mounted pages
    // refetch under the new organization; this stales whatever stays behind.
    void queryClient.invalidateQueries({ queryKey: queryKeys.organizations });
    // A nested route (project detail) belongs to the old organization — land on
    // the section root instead, and stay put when the current route still fits.
    const segments = pathname.split("/").filter(Boolean);
    const section = segments[1] ?? "";
    const target = section ? `/${next.slug || next.id}/${section}` : `/${next.slug || next.id}`;
    if (target !== pathname) void navigate({ to: target });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            title={collapsed ? activeOrganization.name : undefined}
            className={cn(
              "flex h-11 w-full items-center gap-2.5 rounded-lg px-3 text-sm transition-colors duration-150 hover:bg-muted",
              collapsed && "justify-center px-0",
            )}
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary-500/15 text-xs font-bold text-primary-300">
              {organizationInitial(activeOrganization.name)}
            </span>
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block truncate font-bold">{activeOrganization.name}</span>
                </span>
                <IconSelector
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
              </>
            )}
          </button>
        }
      />
      <DropdownMenuContent align="start" className="min-w-52 w-(--anchor-width)">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        </DropdownMenuGroup>
        {isPending && <p className="px-3 py-2 text-sm text-muted-foreground">Loading...</p>}
        {organizations?.map((organization) => (
          <DropdownMenuItem key={organization.id} onClick={() => choose(organization)}>
            <span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary-500/15 text-[10px] font-bold text-primary-300">
              {organizationInitial(organization.name)}
            </span>
            <span className="min-w-0 flex-1 truncate">{organization.name}</span>
            {organization.id === activeOrganization.id && <IconCheck className="text-primary-300" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void navigate({ to: "/workspaces" })}>
          <IconPlus />
          Create organization
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
