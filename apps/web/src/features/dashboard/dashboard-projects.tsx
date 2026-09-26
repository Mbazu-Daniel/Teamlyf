import { Link } from "@tanstack/react-router";
import type { Project } from "@/lib/api";
import { projectProgress, projectStatus } from "./dashboard-home-utils";
import { DashboardPanel } from "./dashboard-panel";

export function DashboardProjects({organizationSlug,projects}:{organizationSlug:string;projects:Project[]}) {
 return <DashboardPanel title="Projects" description="Progress from completed vs total tasks" action={<Link to="/$organizationSlug/projects" params={{organizationSlug}} className="text-sm text-primary hover:underline">View all</Link>}>
  {projects.length ? <ul className="space-y-3">{projects.slice(0,4).map(project=>{const p=projectProgress(project);const s=projectStatus(project.status);return <li key={project.id}><Link to="/$organizationSlug/projects/$projectId" params={{organizationSlug,projectId:project.identifier}} className="group block rounded-[10px] border border-border/60 px-4 py-3.5 transition hover:bg-muted/40">
   <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold group-hover:text-primary">{project.name}</p><div className="mt-2 flex items-center gap-2"><span className={s.className}>{s.label}</span><span className="text-xs text-muted-foreground">{p.total ? `${p.done}/${p.total} tasks` : "No tasks yet"}</span></div></div><span className="text-xs font-semibold tabular-nums">{p.total ? `${p.percent}%` : "—"}</span></div>
   {p.total ? <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{width:`${Math.min(100,Math.max(0,p.percent))}%`}}/></div> : null}
  </Link></li>})}</ul> : <div className="rounded-[12px] border border-dashed border-border px-5 py-12 text-center text-sm text-muted-foreground">No projects yet</div>}
 </DashboardPanel>;
}