import { Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { IconCheck, IconFolder, IconPlus, IconSelector } from "@tabler/icons-react";
import { projectsApi } from "@/lib/api/projects";
import { queryKeys } from "@/lib/queryKeys";
import { useOrganization } from "@/lib/organization";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type ProjectSwitcherProps = Readonly<{ collapsed: boolean }>;

export function ProjectSwitcher({ collapsed }: ProjectSwitcherProps) {
  const { pathname } = useLocation();
  const { organization } = useOrganization();
  const organizationId = organization?.id;
  const organizationSlug = organization?.slug || organization?.id || "";

  const { data: projects = [], isPending } = useQuery({
    queryKey: organizationId ? queryKeys.projects(organizationId) : ["projects", "disabled"],
    queryFn: () => projectsApi.getProjects(organizationId!),
    enabled: Boolean(organizationId),
    staleTime: 30_000,
  });

  if (!organization) return null;

  const activeProject = projects.find((project) =>
    pathname.includes(`/projects/${project.identifier}`),
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            title={collapsed ? activeProject?.name || "Projects" : undefined}
            className={cn(
              "flex h-10 w-full items-center gap-2.5 rounded-lg px-3 text-sm transition-colors hover:bg-muted",
              collapsed && "justify-center px-0",
            )}
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-primary-500/10 text-primary-300">
              <IconFolder className="size-4" aria-hidden="true" />
            </span>
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1 truncate text-left font-semibold">
                  {activeProject?.name || "Projects"}
                </span>
                <IconSelector className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </>
            )}
          </button>
        }
      />
      <DropdownMenuContent align="start" side="top" className="min-w-56 w-(--anchor-width)">
        <DropdownMenuLabel>Projects</DropdownMenuLabel>
        {isPending && <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>}
        {!isPending && projects.length === 0 && (
          <div className="px-3 py-2 text-sm text-muted-foreground">No projects yet</div>
        )}
        {projects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            render={
              <Link
                to="/$organizationSlug/projects/$projectId"
                params={{ organizationSlug, projectId: project.identifier }}
              />
            }
          >
            <IconFolder aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">{project.name}</span>
            {activeProject?.id === project.id && <IconCheck className="text-primary-300" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={<Link to="/$organizationSlug/projects" params={{ organizationSlug }} />}
        >
          <IconPlus aria-hidden="true" />
          Create project
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
