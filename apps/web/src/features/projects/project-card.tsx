import { Link } from "@tanstack/react-router";
import { IconArrowUpRight, IconDots, IconFolder, IconUsers } from "@tabler/icons-react";
import type { Project } from "@/lib/api";
import { slugify } from "@/lib/slug";

export function ProjectCard({
  project,
  organizationSlug,
}: {
  project: Project;
  organizationSlug: string;
}) {
  return (
    <Link
      to="/$organizationSlug/projects/$projectId"
      params={{ organizationSlug, projectId: slugify(project.name) }}
      className="group block overflow-hidden rounded-xl border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <div className="relative h-28 overflow-hidden bg-muted">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-primary/10 to-secondary" />
        <div className="absolute -right-8 -top-12 size-36 rounded-full bg-primary/10 blur-2xl transition-transform duration-500 group-hover:scale-125" />
        <div className="absolute left-4 top-4 flex size-9 items-center justify-center rounded-lg border bg-background/90 text-primary shadow-sm">
          {project.emoji ?? <IconFolder className="size-4" />}
        </div>
        <div className="absolute right-3 top-3 rounded-md border bg-background/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide backdrop-blur">
          {project.identifier}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-semibold">{project.name}</h2>
            <p className="mt-1 line-clamp-2 min-h-8 text-xs leading-4 text-muted-foreground">
              {project.description || "No project description"}
            </p>
          </div>
          <IconArrowUpRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition group-hover:text-foreground" />
        </div>

        <div className="mt-4 flex items-center justify-between border-t pt-3">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
            <IconUsers className="size-3.5" />
            Project workspace
          </span>
          <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold text-muted-foreground transition group-hover:bg-muted group-hover:text-foreground">
            Open
            <IconDots className="size-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
