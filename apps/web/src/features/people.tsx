import { useState } from "react";
import { IconLayoutGrid, IconList, IconUsers } from "@tabler/icons-react";
import { HrmSidebar } from "./people/hrm-sidebar";

export function PeoplePage({ organizationSlug }: { organizationSlug: string }) {
  const [view, setView] = useState<"board" | "list">("board");

  return (
    <div className="flex h-full min-h-0 gap-4 overflow-hidden p-3 md:p-4">
      <HrmSidebar organizationSlug={organizationSlug} />
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1440px]">
          <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div><h1 className="text-2xl font-semibold">People & HR</h1><p className="mt-1 text-sm text-muted-foreground">Employees, departments and leave management.</p></div>
            <div className="flex items-center rounded-lg bg-muted p-1">
              <button type="button" aria-label="Board view" aria-pressed={view === "board"} onClick={() => setView("board")} className={"rounded-md p-2 " + (view === "board" ? "bg-background shadow-sm" : "")}><IconLayoutGrid className="size-4" /></button>
              <button type="button" aria-label="List view" aria-pressed={view === "list"} onClick={() => setView("list")} className={"rounded-md p-2 " + (view === "list" ? "bg-background shadow-sm" : "")}><IconList className="size-4" /></button>
            </div>
          </header>
          <section id="employees" className="rounded-[16px] border bg-card p-8 text-center">
            <IconUsers className="mx-auto size-9 text-muted-foreground/50" />
            <h2 className="mt-4 text-lg font-semibold">{view === "board" ? "Employee records" : "Employee list"}</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">HR employee records are not connected to this UI yet. No sample employees are shown so this page cannot be mistaken for live organization data.</p>
          </section>
          <section id="departments" className="mt-6 rounded-[16px] border bg-card p-6">
            <h2 className="text-base font-semibold">Departments</h2>
            <p className="mt-1 text-sm text-muted-foreground">Department data will appear here when the HR department API is connected.</p>
          </section>
          <section id="leave" className="mt-6 rounded-[16px] border bg-card p-6">
            <h2 className="text-base font-semibold">Leave</h2>
            <p className="mt-1 text-sm text-muted-foreground">Leave requests will appear here when the HR leave API is connected.</p>
          </section>
        </div>
      </main>
    </div>
  );
}
