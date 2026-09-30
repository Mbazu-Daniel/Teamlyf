import { DashboardPanel } from "./dashboard-panel";
import type { WeekThroughput } from "./dashboard-metrics";

export function DashboardThroughput({
  weeks,
  summary,
}: {
  weeks: readonly WeekThroughput[];
  summary: string;
}) {
  const peak = Math.max(1, ...weeks.map((week) => Math.max(week.created, week.completed)));
  const labelled = new Set([0, Math.floor(weeks.length / 2), weeks.length - 1]);
  const quiet = weeks.every((week) => week.created === 0 && week.completed === 0);

  return (
    <DashboardPanel title="Throughput" description="Tasks created and completed each week.">
      <p className="mb-4 text-sm text-muted-foreground">{summary}</p>

      {quiet ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          No task activity in the last {weeks.length} weeks.
        </p>
      ) : (
        <div
          role="img"
          aria-label={`Weekly throughput chart. ${summary}`}
          className="flex h-36 items-end gap-1.5"
        >
          {weeks.map((week, index) => (
            <div
              key={week.weekStart}
              className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1"
            >
              <div className="flex h-full items-end justify-center gap-1">
                <span
                  className="w-1/2 max-w-3 rounded-sm bg-muted-foreground/35"
                  style={{ height: `${(week.created / peak) * 100}%` }}
                  title={`${week.created} created in the week of ${week.label}`}
                />
                <span
                  className="w-1/2 max-w-3 rounded-sm bg-emerald-500"
                  style={{ height: `${(week.completed / peak) * 100}%` }}
                  title={`${week.completed} completed in the week of ${week.label}`}
                />
              </div>
              <span className="h-3 text-center text-[10px] leading-3 text-muted-foreground">
                {labelled.has(index) ? week.label : ""}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-muted-foreground/35" aria-hidden="true" /> Created
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm bg-emerald-500" aria-hidden="true" /> Completed
        </span>
      </div>
    </DashboardPanel>
  );
}
