import { cn } from "@/lib/utils";
import type { KpiTile } from "./dashboard-metrics";

/** The metric strip: quiet label, big number, one line of context. */
export function DashboardKpiStrip({ tiles }: { tiles: readonly KpiTile[] }) {
  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" aria-label="Workspace metrics">
      {tiles.map((tile) => (
        <div key={tile.label} className="rounded-xl border border-border/60 bg-card px-4 py-3.5 shadow-sm">
          <p className="text-xs text-muted-foreground">{tile.label}</p>
          <p className={cn("mt-1.5 text-2xl font-semibold tabular-nums tracking-[-0.03em]", tile.tone)}>
            {tile.value}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">{tile.caption}</p>
        </div>
      ))}
    </section>
  );
}
