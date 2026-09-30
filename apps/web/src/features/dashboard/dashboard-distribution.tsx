import { DashboardPanel } from "./dashboard-panel";
import type { DistributionSlice } from "./dashboard-metrics";

export function DashboardDistribution({ slices }: { slices: readonly DistributionSlice[] }) {
  const total = slices.reduce((sum, slice) => sum + slice.count, 0);

  return (
    <DashboardPanel title="Task distribution" description="By status category.">
      {total === 0 ? (
        <p className="text-sm text-muted-foreground">
          No tasks yet — the split appears once work exists.
        </p>
      ) : (
        <>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted" aria-hidden="true">
            {slices.map((slice) => (
              <span
                key={slice.group}
                className="h-full"
                style={{ width: `${(slice.count / total) * 100}%`, backgroundColor: slice.color }}
              />
            ))}
          </div>
          <ul className="mt-4 space-y-2.5">
            {slices.map((slice) => (
              <li key={slice.group} className="flex items-center gap-2.5 text-sm">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: slice.color }}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate text-muted-foreground">{slice.label}</span>
                <span className="tabular-nums font-medium">
                  {slice.count}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    ({slice.percent}%)
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </DashboardPanel>
  );
}
