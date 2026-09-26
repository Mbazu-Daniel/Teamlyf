import { IconCalendarEvent, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useMemo, useState } from "react";

export function SchedulePage() {
  const [month, setMonth] = useState(() => new Date());
  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }, [month]);
  const label = month.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-y-auto p-3 md:p-4">
      <section className="rounded-[24px] border bg-white/90 p-6 shadow-sm dark:bg-card">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Month View</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">{label}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Calendar UI is ready; event persistence is not connected yet.</p>
      </section>
      <section className="overflow-hidden rounded-[24px] border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b bg-muted/20 p-4">
          <div className="flex items-center gap-1 rounded-[10px] bg-muted p-1">
            <button type="button" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="grid size-9 place-items-center rounded-lg hover:bg-background"><IconChevronLeft className="size-4" /></button>
            <button type="button" onClick={() => setMonth(new Date())} className="h-9 rounded-lg px-3 text-sm font-medium hover:bg-background">Today</button>
            <button type="button" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="grid size-9 place-items-center rounded-lg hover:bg-background"><IconChevronRight className="size-4" /></button>
          </div>
          <span className="flex items-center gap-2 text-xs text-muted-foreground"><IconCalendarEvent className="size-4" /> Calendar</span>
        </div>
        <div className="grid grid-cols-7 border-b bg-muted/30">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((day) => <div key={day} className="py-3 text-center text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">{day}</div>)}</div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const current = day.getMonth() === month.getMonth();
            const today = day.toDateString() === new Date().toDateString();
            return <div key={day.toISOString()} className={"min-h-[120px] border-b border-r p-2 " + (current ? "bg-background" : "bg-muted/20")}>
              <span className={"flex size-7 items-center justify-center rounded-full text-xs font-semibold " + (today ? "bg-primary text-primary-foreground" : current ? "" : "text-muted-foreground")}>{day.getDate()}</span>
            </div>;
          })}
        </div>
      </section>
    </div>
  );
}
