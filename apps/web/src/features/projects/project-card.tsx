import { Link } from "@tanstack/react-router";
import { IconArrowUpRight, IconUsers } from "@tabler/icons-react";
import type { Project } from "@/lib/api";

const STATUS_STYLES: Record<string, string> = {
  planned: "bg-violet-100 text-violet-700 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-400/20",
  backlog: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-400/20",
  in_progress: "bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/20",
  paused: "bg-amber-100 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/20",
  completed: "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/20",
  cancelled: "bg-rose-100 text-rose-700 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/20",
};

const STATUS_DOT_STYLES: Record<string, string> = {
  planned: "bg-violet-500",
  backlog: "bg-slate-400",
  in_progress: "bg-blue-500",
  paused: "bg-amber-500",
  completed: "bg-emerald-500",
  cancelled: "bg-rose-500",
};

const CARD_STYLES: Record<string, string> = {
  planned: "border-violet-200/80 bg-violet-50/70 hover:border-violet-400 dark:border-violet-400/20 dark:bg-violet-500/10 dark:hover:border-violet-400/50",
  backlog: "border-slate-200/80 bg-slate-50/70 hover:border-slate-400 dark:border-slate-400/20 dark:bg-slate-500/10 dark:hover:border-slate-400/50",
  in_progress: "border-blue-200/80 bg-blue-50/70 hover:border-blue-400 dark:border-blue-400/20 dark:bg-blue-500/10 dark:hover:border-blue-400/50",
  paused: "border-amber-200/80 bg-amber-50/70 hover:border-amber-400 dark:border-amber-400/20 dark:bg-amber-500/10 dark:hover:border-amber-400/50",
  completed: "border-emerald-200/80 bg-emerald-50/70 hover:border-emerald-400 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:hover:border-emerald-400/50",
  cancelled: "border-rose-200/80 bg-rose-50/70 hover:border-rose-400 dark:border-rose-400/20 dark:bg-rose-500/10 dark:hover:border-rose-400/50",
};

export function ProjectCard({
  project,
  organizationSlug,
}: {
  project: Project;
  organizationSlug: string;
}) {
  const firstLetter = project.name?.charAt(0).toUpperCase() || "P";
  const members = project.members ?? [];
  const status = project.status ?? "planned";
  const tone = STATUS_STYLES[status] ?? STATUS_STYLES.planned;

  return (
    <article className={`group flex min-w-0 overflow-hidden rounded-[16px] border shadow-none transition-colors duration-200 ${CARD_STYLES[status] ?? CARD_STYLES.planned}`}>
      <Link
        to="/$organizationSlug/projects/$projectId"
        params={{ organizationSlug, projectId: project.identifier }}
        aria-label={`Open ${project.name}`}
        className="flex min-h-[192px] w-full min-w-0 flex-col p-4 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
      >
        <div className="flex items-center gap-3">
          <span className={`relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-[10px] text-sm font-medium ${tone}`}>
            {project.coverImageURL ? <img src={project.coverImageURL} alt={`${project.name} project cover`} className="size-full object-cover" /> : project.emoji || firstLetter}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[14px] font-semibold leading-5 tracking-[-0.015em] text-foreground" title={project.name}>{project.name}</h3>
            <span className="mt-1 block truncate text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{project.code || project.identifier}</span>
          </div>
          <IconArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-primary" />
        </div>

        <p className="mb-4 mt-3 line-clamp-2 text-[12px] leading-5 text-muted-foreground">{project.description || "No description yet."}</p>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/50 pt-3">
            <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-medium capitalize ${tone}`}>
              <span className={`size-1.5 rounded-full ${STATUS_DOT_STYLES[status] ?? STATUS_DOT_STYLES.planned}`} />
              {status.replaceAll("_", " ")}
            </span>
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"><IconUsers className="size-3.5" />{members.length} {members.length === 1 ? "member" : "members"}</span>
            {members.length > 0 && (
              <div className="flex -space-x-1.5" aria-label="Project members">
                {members.slice(0, 2).map((member) => (
                  <span key={member.id} title={`${member.firstName ?? ""} ${member.lastName ?? ""}`.trim() || "Project member"} className={`grid size-7 place-items-center overflow-hidden rounded-full border-2 border-card text-[9px] font-medium ${tone}`}>
                    {((member.firstName?.[0] ?? "") + (member.lastName?.[0] ?? "")).toUpperCase() || "?"}
                  </span>
                ))}
                {members.length > 2 && <span className="grid size-7 place-items-center rounded-full border-2 border-card bg-muted text-[9px] font-medium text-muted-foreground">+{members.length - 2}</span>}
              </div>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
