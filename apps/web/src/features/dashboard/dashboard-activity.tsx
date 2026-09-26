import { DashboardPanel } from "./dashboard-panel";

export function DashboardActivity({ projectCount, activeCount }: { projectCount: number; activeCount: number }) {
  const items = [
    ["Projects tracked", String(projectCount)],
    ["Projects in progress", String(activeCount)],
    ["Workspace ready", projectCount > 0 ? "Yes" : "Start with a project"],
  ];

  return (
    <DashboardPanel title="Recent activity" description="Your organization workspace at a glance">
      {items.length ? (
        <ul className="divide-y divide-border/60">
          {items.map(([label, value], index) => (
            <li key={label} className="flex gap-3 py-3.5 first:pt-0 last:pb-0">
              <div className="flex flex-col items-center pt-1.5"><span className={`h-2 w-2 rounded-full ${index === 0 ? "bg-primary" : "bg-border"}`} /></div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{value}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-[12px] border border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">No recent activity</div>
      )}
    </DashboardPanel>
  );
}
