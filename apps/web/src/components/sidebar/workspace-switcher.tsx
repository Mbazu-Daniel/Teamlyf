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

function workspaceInitial(name: string) {
  return name.slice(0, 1).toUpperCase();
}

type WorkspaceSwitcherProps = Readonly<{ collapsed: boolean }>;

/**
 * Shows the active workspace and lists the member's other workspaces.
 * Picking one persists it under `teamlyf:organization-id` (the key
 * OrganizationProvider restores from) and reloads the new workspace's data.
 */
export function WorkspaceSwitcher({ collapsed }: WorkspaceSwitcherProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const { organization, selectOrganization } = useOrganization();
  const { data: workspaces, isPending } = useQuery({
    queryKey: queryKeys.organizations,
    queryFn: getOrganizations,
    staleTime: 30_000,
  });

  // The shell only mounts once a workspace exists; the guard keeps this honest.
  // Bound once so `choose` and the trigger read a narrowed workspace, not the union.
  if (!organization) return null;
  const activeWorkspace = organization;

  function choose(next: Organization) {
    if (next.id === activeWorkspace.id) return;
    selectOrganization(next);
    // Every cached resource is keyed by organization id, so mounted pages
    // refetch under the new workspace; this stales whatever stays behind.
    void queryClient.invalidateQueries({ queryKey: queryKeys.organizations });
    // A nested route (project detail) belongs to the old workspace — land on
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
            title={collapsed ? activeWorkspace.name : undefined}
            className={cn(
              "flex h-11 w-full items-center gap-2.5 rounded-lg px-3 text-sm transition-colors duration-150 hover:bg-muted",
              collapsed && "justify-center px-0",
            )}
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary-500/15 text-xs font-bold text-primary-300">
              {workspaceInitial(activeWorkspace.name)}
            </span>
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block truncate font-bold">{activeWorkspace.name}</span>
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
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        </DropdownMenuGroup>
        {isPending && <p className="px-3 py-2 text-sm text-muted-foreground">Loading...</p>}
        {workspaces?.map((workspace) => (
          <DropdownMenuItem key={workspace.id} onClick={() => choose(workspace)}>
            <span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary-500/15 text-[10px] font-bold text-primary-300">
              {workspaceInitial(workspace.name)}
            </span>
            <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
            {workspace.id === activeWorkspace.id && <IconCheck className="text-primary-300" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => void navigate({ to: "/workspaces" })}>
          <IconPlus />
          Create workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
