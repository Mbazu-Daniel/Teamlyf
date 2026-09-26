import { DashboardPanel } from "./dashboard-panel";

export function DashboardActivity({projectCount,activeCount}:{projectCount:number;activeCount:number}) {
 return <DashboardPanel title="Recent activity" description="Your organization workspace at a glance">
  <div className="divide-y divide-border/60">
   {[["Projects tracked",projectCount],["Projects in progress",activeCount],["Workspace ready",projectCount > 0 ? "Yes" : "Start with a project"]].map(([label,value])=><div key={String(label)} className="flex items-center justify-between gap-4 py-3.5 first:pt-0"><p className="text-sm font-medium">{label}</p><span className="text-xs text-muted-foreground">{value}</span></div>)}
  </div>
 </DashboardPanel>;
}