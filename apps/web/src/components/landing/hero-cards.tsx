import { IconCalendar, IconClock, IconTrendingUp } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";

/**
 * Tier-A CSS product cards — the Workbench hero media. Tokens only, no hex.
 * Illustrative UI mock data (not marketing claims). One reveal per card, capped at 420ms.
 */
export function HeroCards() {
  return (
    <div
      aria-label="Preview of Teamlyf task, chart, time and meeting cards"
      className="grid grid-cols-2 gap-3 sm:gap-4"
    >
      {/* task card */}
      <article
        className="reveal reveal-y col-span-2 rounded-2xl border bg-card p-4"
        style={{ animationDelay: "240ms" }}
      >
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-bold">Design branding</h3>
          <Badge variant="accent">In progress</Badge>
        </div>
        <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
          <span>Progress</span>
          <span className="tabular-nums text-text-200">35%</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-background-700">
          <div className="h-full rounded-full bg-primary" style={{ width: "35%" }} />
        </div>
      </article>

      {/* chart card */}
      <article className="reveal reveal-y rounded-2xl border bg-card p-4" style={{ animationDelay: "300ms" }}>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <IconTrendingUp className="size-4 text-accent-400" />
          Tasks done
        </div>
        <div className="mt-3 flex h-20 items-end gap-2" aria-hidden="true">
          {[40, 65, 50, 90, 70].map((height, index) => (
            <div
              key={height + index}
              className={`flex-1 rounded-t-sm ${index === 3 ? "bg-secondary-500" : "bg-background-600"}`}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">This week</p>
      </article>

      {/* time card */}
      <article className="reveal reveal-y rounded-2xl border bg-card p-4" style={{ animationDelay: "360ms" }}>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <IconClock className="size-4" />
          Avg. time spent
        </div>
        <p className="mt-2 text-3xl font-bold tabular-nums">6h 12m</p>
        <p className="mt-1 text-sm text-muted-foreground">Per task, this week</p>
      </article>

      {/* meeting card */}
      <article
        className="reveal reveal-y col-span-2 flex items-center gap-3 rounded-2xl border bg-card p-4"
        style={{ animationDelay: "420ms" }}
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-500/15 text-primary-300">
          <IconCalendar className="size-5" />
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold">Sprint planning</h3>
          <p className="text-sm text-muted-foreground tabular-nums">10:00-10:30</p>
        </div>
        <Badge variant="primary" className="ml-auto">
          Video call
        </Badge>
      </article>
    </div>
  );
}
