import { Link } from "@tanstack/react-router";
import { IconArrowRight, IconPlus } from "@tabler/icons-react";

export function DashboardHero({organizationSlug,organizationName,projectCount,activeCount,completedCount,plannedCount}:{organizationSlug:string;organizationName:string;projectCount:number;activeCount:number;completedCount:number;plannedCount:number}) {
 return <section className="flex flex-col gap-5">
  <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-5">
   <div className="min-w-0"><h1 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">Welcome back</h1><p className="mt-2 max-w-[42rem] text-sm text-muted-foreground">Here is what is happening in {organizationName}. {activeCount} active projects · {projectCount} total projects.</p></div>
   <div className="flex flex-wrap gap-2">
    <Link to="/$organizationSlug/tasks" params={{organizationSlug}} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"><IconPlus className="size-4"/>New task</Link>
    <Link to="/$organizationSlug/projects" params={{organizationSlug}} className="inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium hover:bg-muted">Projects<IconArrowRight className="size-4"/></Link>
   </div>
  </div>
  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[["Projects",projectCount],["Active",activeCount],["Completed",completedCount],["Planned",plannedCount]].map(([label,value])=><div key={label as string} className="rounded-[12px] border border-border/60 bg-white dark:bg-card p-5"><p className="text-3xl font-semibold tabular-nums">{value}</p><p className="mt-3 text-xs text-muted-foreground">{label}</p></div>)}</div>
 </section>;
}