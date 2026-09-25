import type { ReactNode } from "react";
import { IconCalendar, IconClock, IconTrendingUp } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Tier-A CSS product cards — the hero collage. Tokens only, no hex.
 * Illustrative UI mock data (not marketing claims).
 *
 * The offsets and rotations sit on the column wrappers and the reveal sits on
 * the cards: `reveal-y` writes `transform`, so it must never share an element
 * with a `rotate-*` or `translate-*` utility.
 */
function HeroCard({
  children,
  delay,
  className,
}: {
  children: ReactNode;
  delay: number;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "reveal reveal-y rounded-2xl border bg-card p-4 shadow-lg shadow-background-950/40",
        className,
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </article>
  );
}

/** Overlapping initials — the same avatar stack the app uses in task rows. */
function Avatars({ initials }: { initials: string[] }) {
  return (
    <div className="flex -space-x-2" aria-hidden="true">
      {initials.map((initial, index) => (
        <span
          key={initial}
          className={cn(
            "grid size-7 place-items-center rounded-full border-2 border-card text-xs font-bold",
            index % 2 === 0
              ? "bg-primary-500/25 text-primary-100"
              : "bg-secondary-500/25 text-secondary-100",
          )}
        >
          {initial}
        </span>
      ))}
    </div>
  );
}

const bars = [40, 65, 50, 90, 70];
const barHeight = (height: number) => `${height}%`;

export function HeroCards() {
  return (
    <div
      aria-label="Preview of Teamlyf task, chart, time and meeting cards"
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:items-start"
    >
      {/* column one — sits low and tilts away from the centre */}
      <div className="flex flex-col gap-4 lg:translate-y-10 lg:-rotate-[1.5deg]">
        <HeroCard delay={240}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-bold">Design branding</h3>
            <Badge variant="accent">In progress</Badge>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span className="tabular-nums text-text-200">35%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-background-700">
            <div className="h-full rounded-full bg-primary" style={{ width: "35%" }} />
          </div>
        </HeroCard>

        <HeroCard delay={300} className="flex items-center gap-3">
          <Avatars initials={["AO", "TK"]} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">2 teammates</p>
            <p className="text-xs text-muted-foreground">Own this task</p>
          </div>
        </HeroCard>
      </div>

      {/* column two — the anchor, closest to the fold */}
      <div className="flex flex-col gap-4 lg:-translate-y-2">
        <HeroCard delay={360}>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <IconTrendingUp className="size-4 text-accent-400" aria-hidden="true" />
            Tasks done
          </div>
          <div className="mt-4 flex h-24 items-end gap-2" aria-hidden="true">
            {bars.map((height, index) => (
              <div
                key={height}
                className={cn(
                  "flex-1 rounded-t-sm",
                  index === 3 ? "bg-secondary-500" : "bg-background-600",
                )}
                style={{ height: barHeight(height) }}
              />
            ))}
          </div>
          <p className="mt-3 text-sm text-muted-foreground">This week</p>
        </HeroCard>

        <HeroCard delay={420}>
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-muted-foreground">Avg. time spent</p>
            <span
              className="grid size-9 shrink-0 place-items-center rounded-full bg-text-50 text-background-950"
              aria-hidden="true"
            >
              <IconClock className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-3xl font-bold tabular-nums">6h 12m</p>
          <p className="mt-1 text-sm text-muted-foreground">Per task, this week</p>
        </HeroCard>
      </div>

      {/* column three — sits lowest, the tall card that anchors the right edge */}
      <div className="flex flex-col gap-4 sm:col-span-2 lg:col-span-1 lg:translate-y-16 lg:rotate-[1.5deg]">
        <HeroCard delay={480}>
          <div className="flex items-center gap-2">
            <Badge variant="primary">Video call</Badge>
            <span className="text-sm text-muted-foreground tabular-nums">10:00-10:30</span>
          </div>
          <h3 className="mt-4 text-xl font-bold">Sprint planning</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Walk the board with the team, then move the cards that matter into Done.
          </p>
          <div className="mt-5 flex items-center justify-between gap-3">
            <Avatars initials={["AO", "TK", "JM"]} />
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <IconCalendar className="size-4" aria-hidden="true" />
              Today
            </span>
          </div>
        </HeroCard>
      </div>
    </div>
  );
}
