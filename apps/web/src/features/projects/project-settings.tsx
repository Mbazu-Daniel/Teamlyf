import { Link } from "@tanstack/react-router";
import { IconBrandGithub, IconChevronLeft, IconPlugConnected } from "@tabler/icons-react";
import type { Project } from "@/lib/api";

type ProjectSettingsProps = {
  project: Project;
  organizationSlug: string;
};

export function ProjectSettings({ project, organizationSlug }: ProjectSettingsProps) {
  return (
    <div className="mx-auto w-full max-w-4xl p-5 sm:p-8">
      <Link to="/$organizationSlug/projects/$projectId" params={{ organizationSlug, projectId: project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") }} className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <IconChevronLeft className="size-4" /> Back to project
      </Link>
      <div className="mb-8"><h1 className="text-xl font-semibold">Project settings</h1><p className="mt-1 text-sm text-muted-foreground">Configure integrations and automation for {project.name}.</p></div>
      <section className="overflow-hidden rounded-xl border bg-card">
        <div className="border-b px-5 py-4"><div className="flex items-center gap-2"><IconPlugConnected className="size-4" /><h2 className="text-sm font-semibold">Integrations</h2></div><p className="mt-1 text-xs text-muted-foreground">Connect this project to the tools agents use to complete tasks.</p></div>
        <div className="flex items-center justify-between gap-4 p-5">
          <div className="flex min-w-0 items-center gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-lg border bg-background"><IconBrandGithub className="size-5" /></div><div className="min-w-0"><h3 className="text-sm font-medium">GitHub</h3><p className="mt-0.5 text-xs text-muted-foreground">Connect a repository so project agents can work on tasks against its codebase.</p></div></div>
          <button type="button" className="shrink-0 rounded-md border px-3 py-2 text-xs font-semibold hover:bg-muted">Connect repository</button>
        </div>
        <div className="border-t bg-muted/20 px-5 py-3 text-xs text-muted-foreground">Once connected, the repository and branch will be available as project context for task automation.</div>
      </section>
    </div>
  );
}
