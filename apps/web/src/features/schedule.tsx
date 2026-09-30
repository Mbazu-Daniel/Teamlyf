import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  PageHeader,
  WorkspacePage,
  pageInput,
  pagePrimaryAction,
} from "@/components/workspace/page-layout";
import { WorkflowError } from "@/components/workspace/workflow";
import { useOrganization } from "@/lib/organization";
import { scheduleApi, type CalendarEvent } from "@/lib/api/schedule";
import { EventForm } from "./schedule/event-form";

const colors: Record<string, string> = {
  violet: "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200",
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200",
  green: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200",
  rose: "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200",
};

export function SchedulePage() {
  const { organization } = useOrganization();
  return organization ? <Calendar org={organization.id} /> : null;
}

function Calendar({ org }: { org: string }) {
  const [anchor, setAnchor] = useState(() => new Date());
  const [view, setView] = useState("month");
  const [editing, setEditing] = useState<{ day: Date; event?: CalendarEvent } | null>(null);
  const days = useMemo(() => {
    const first =
      view === "month" ? new Date(anchor.getFullYear(), anchor.getMonth(), 1) : new Date(anchor);
    first.setHours(0, 0, 0, 0);
    first.setDate(first.getDate() - first.getDay());
    return Array.from({ length: view === "month" ? 42 : 7 }, (_, index) => {
      const date = new Date(first);
      date.setDate(first.getDate() + index);
      return date;
    });
  }, [anchor, view]);
  const end = new Date(days[days.length - 1]!);
  end.setDate(end.getDate() + 1);
  const from = days[0]!.toISOString(),
    to = end.toISOString();
  const events = useQuery({
    queryKey: ["events", org, from, to],
    queryFn: () => scheduleApi.list(org, from, to),
    retry: false,
  });
  function move(direction: number) {
    setAnchor((current) =>
      view === "month"
        ? new Date(current.getFullYear(), current.getMonth() + direction, 1)
        : new Date(current.getFullYear(), current.getMonth(), current.getDate() + direction * 7),
    );
  }
  const label = anchor.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  return (
    <WorkspacePage>
      <PageHeader
        actions={
          <button className={pagePrimaryAction} onClick={() => setEditing({ day: anchor })}>
            Create event
          </button>
        }
      />
      <WorkflowError error={events.error} />
      <section className="overflow-hidden rounded-2xl border border-border/70 bg-card">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b p-5">
          <h2 className="text-lg font-semibold">{label}</h2>
          <div className="flex items-center gap-3">
            <select
              aria-label="Calendar view"
              className={pageInput}
              value={view}
              onChange={(e) => setView(e.target.value)}
            >
              <option value="month">Month</option>
              <option value="week">Week</option>
            </select>
            <div className="flex h-control items-center rounded-xl border p-1">
              <button
                aria-label="Previous period"
                onClick={() => move(-1)}
                className="grid h-full w-9 place-items-center"
              >
                <IconChevronLeft className="size-4" />
              </button>
              <button onClick={() => setAnchor(new Date())} className="h-full px-3 text-sm">
                Today
              </button>
              <button
                aria-label="Next period"
                onClick={() => move(1)}
                className="grid h-full w-9 place-items-center"
              >
                <IconChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
        {events.isPending && (
          <p role="status" className="p-3 text-sm text-muted-foreground">
            Loading events…
          </p>
        )}
        <div className="overflow-x-auto">
          <div className="min-w-[650px]">
            <div className="grid grid-cols-7 border-b bg-muted/25">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="py-3 text-center text-xs text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day) => {
                const next = new Date(day);
                next.setDate(day.getDate() + 1);
                const daily =
                  events.data?.filter(
                    (event) => new Date(event.startsAt) < next && new Date(event.endsAt) > day,
                  ) ?? [];
                return (
                  <div
                    key={day.toISOString()}
                    className={`border-b border-r p-2 [&:nth-child(7n)]:border-r-0 ${view === "month" ? "min-h-32" : "min-h-96"} ${day.getMonth() === anchor.getMonth() ? "" : "bg-muted/20"}`}
                  >
                    <button
                      aria-label={`Create event on ${day.toLocaleDateString()}`}
                      className={`mb-2 grid size-7 place-items-center rounded-full text-xs ${day.toDateString() === new Date().toDateString() ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                      onClick={() => setEditing({ day })}
                    >
                      {day.getDate()}
                    </button>
                    <div className="space-y-1">
                      {daily.map((event) => (
                        <button
                          key={event.id}
                          onClick={() => setEditing({ day, event })}
                          className={`block w-full rounded-lg p-2 text-left text-xs ${colors[event.color] ?? colors.violet}`}
                        >
                          <span className="block truncate font-medium">{event.title}</span>
                          <span className="block opacity-80">
                            {new Date(event.startsAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
      {!events.isPending && !events.error && !events.data?.length && (
        <p className="text-sm text-muted-foreground">
          No events in this period. Select a date to create one.
        </p>
      )}
      {editing && <EventForm org={org} {...editing} onClose={() => setEditing(null)} />}
    </WorkspacePage>
  );
}
