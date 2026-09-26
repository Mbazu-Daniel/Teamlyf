import { Link } from "@tanstack/react-router";
import { IconDots, IconExternalLink, IconLink, IconPencil, IconPlus, IconStar, IconTrash, IconUsers } from "@tabler/icons-react";
import type { Project } from "@/lib/api";
import { slugify } from "@/lib/slug";

const SHINY_PRESETS = [
  "from-purple-500 via-indigo-400 to-blue-600",
  "from-rose-500 via-fuchsia-400 to-purple-600",
  "from-emerald-500 via-teal-400 to-cyan-600",
  "from-amber-400 via-orange-500 to-rose-500",
  "from-blue-600 via-sky-400 to-indigo-500",
];

export function ProjectCard({
  project,
  organizationSlug,
}: {
  project: Project;
  organizationSlug: string;
}) {
  const firstLetter = project.name?.charAt(0).toUpperCase() || "P";
  const preset = SHINY_PRESETS[
    project.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % SHINY_PRESETS.length
  ];
  const members = project.members ?? [];
  const leads = project.leads ?? [];

  async function copyLink(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    await navigator.clipboard.writeText(window.location.origin + `/${organizationSlug}/projects/${project.identifier}`);
  }

  return (
    <div className="group flex min-h-[330px] flex-col overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm transition-all duration-300 hover:shadow-md">
      <Link
        to="/$organizationSlug/projects/$projectId"
        params={{ organizationSlug, projectId: project.identifier }}
        className="flex h-full flex-col"
      >
        <div className="relative h-32 w-full shrink-0 overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${preset} transition-transform duration-500 group-hover:scale-105`}>
            <div className="absolute -left-10 -top-10 size-40 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute -bottom-5 -right-5 size-32 rounded-full bg-black/10 blur-2xl" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/10 opacity-60 transition-opacity group-hover:opacity-80" />

          <div className="absolute left-3 right-3 top-3 z-20 flex items-center justify-between">
            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="flex size-8 items-center justify-center rounded-full text-white/80 transition hover:bg-black/20 hover:text-yellow-400">
              <IconStar className="size-4 fill-current" />
            </button>
            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="flex size-8 items-center justify-center rounded-full bg-black/10 text-white backdrop-blur-md transition hover:bg-black/30">
              <IconDots className="size-4" />
            </button>
          </div>

          <div className="absolute -bottom-5 left-5 z-20 flex size-12 items-center justify-center rounded-xl border-2 border-background bg-background text-base font-bold shadow-lg">
            <span className={`bg-gradient-to-br ${preset} bg-clip-text text-transparent`}>{firstLetter}</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col p-5 pb-4 pt-8">
          <div className="mb-2 flex items-start justify-between gap-4">
            <h3 className="line-clamp-1 text-[16px] font-bold leading-snug">{project.name}</h3>
            <span className="shrink-0 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
              {project.code || project.identifier || "PRJ"}
            </span>
          </div>
          <p className="min-h-[36px] flex-1 line-clamp-2 text-xs leading-relaxed text-foreground/70">
            {project.description || "No description provided for this project."}
          </p>

          <div className="mt-5 flex items-center justify-between border-t border-border/40 pt-4">
            <div className="flex items-center">
              {members.length === 0 ? (
                <span className="inline-flex h-7 items-center gap-1.5 rounded border border-dashed border-primary/40 px-2.5 text-[10px] font-medium text-primary">
                  <IconPlus className="size-3" /> Add member
                </span>
              ) : (
                <div className="flex -space-x-2">
                  {members.slice(0, 3).map((member, index) => (
                    <span key={member.id} title={`${member.firstName ?? ""} ${member.lastName ?? ""}`.trim()} className="flex size-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[9px] font-semibold" style={{ zIndex: 10 - index }}>
                      {(member.firstName?.[0] ?? "") + (member.lastName?.[0] ?? "") || "?"}
                    </span>
                  ))}
                  {members.length > 3 && <span className="flex size-7 items-center justify-center rounded-full border-2 border-background bg-primary/10 text-[9px] font-bold text-primary">+{members.length - 3}</span>}
                  <span className="ml-1 flex size-7 items-center justify-center rounded-full border border-dashed border-primary/40 text-primary"><IconPlus className="size-3" /></span>
                </div>
              )}
            </div>
            {leads.length > 0 && (
              <div className="border-l border-border/60 pl-3">
                <span className="flex size-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[9px] font-semibold" title="Project Lead">
                  {(leads[0].firstName?.[0] ?? "") + (leads[0].lastName?.[0] ?? "") || "?"}
                </span>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
            <IconUsers className="size-3" /> {members.length} {members.length === 1 ? "member" : "members"}
          </div>
        </div>
      </Link>

      <div className="absolute hidden" aria-hidden="true">
        <IconExternalLink /><IconLink /><IconPencil /><IconTrash />
      </div>
      <button type="button" onClick={copyLink} className="sr-only">Copy project link</button>
    </div>
  );
}
