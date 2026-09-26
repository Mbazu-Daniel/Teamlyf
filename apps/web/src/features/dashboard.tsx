import { DashboardHero } from "./dashboard/dashboard-hero";
import { DashboardProjects } from "./dashboard/dashboard-projects";
import { DashboardActivity } from "./dashboard/dashboard-activity";
import type { Project } from "@/lib/api";

export function DashboardPage({organizationSlug,organizationName,projects}:{organizationSlug:string;organizationName:string;projects:Project[]}) {
 const active=projects.filter(p=>p.status==="in_progress");
 return <div className="tl-dashboard mx-auto flex h-full w-full max-w-[1440px] flex-col gap-5 overflow-y-auto pb-2">
  <DashboardHero organizationSlug={organizationSlug} organizationName={organizationName} projectCount={projects.length} activeCount={active.length}/>
  <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)]"><DashboardProjects organizationSlug={organizationSlug} projects={active}/><DashboardActivity projectCount={projects.length} activeCount={active.length}/></div>
 </div>;
}