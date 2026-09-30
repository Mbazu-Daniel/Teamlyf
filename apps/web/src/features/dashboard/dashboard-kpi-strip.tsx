import { cn } from "@/lib/utils";
import type { KpiTile } from "./dashboard-metrics";

export function DashboardKpiStrip({ tiles }: { tiles: readonly KpiTile[] }) {
  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Workspace metrics">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="rounded-[14px] border border-border/70 bg-card px-4 py-3.5 shadow-[0_8px_20px_-18px_rgb(11_28_48_/_0.2)]"
        >
          <p className="truncate text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {tile.label}
          </p>
          <p
            className={cn(
              "mt-1.5 text-3xl font-semibold leading-none tabular-nums tracking-[-0.03em]",
              tile.tone,
            )}
          >
            {tile.value}
          </p>
          <p className="mt-1.5 truncate text-xs text-muted-foreground">{tile.caption}</p>
        </div>
      ))}
    </section>
  );
}
