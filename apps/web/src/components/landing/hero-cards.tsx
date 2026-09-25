import { IconCalendar, IconCheck, IconMessage, IconSparkles, IconUsers } from "@tabler/icons-react";

function SidebarItem({ label, active }: { label: string; active?: boolean }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-[11px] font-medium ${active ? "bg-[var(--landing-soft)] text-[var(--landing-ink)]" : "text-[var(--landing-muted)]"}`}>
      <span className="size-1.5 rounded-full bg-[var(--landing-dot)]" aria-hidden="true" />
      {label}
    </div>
  );
}

function Task({ title, person, done }: { title: string; person: string; done?: boolean }) {
  return (
    <div className="flex items-center gap-3 border-b border-[var(--landing-line)] px-3 py-3 last:border-0">
      <span className={`grid size-5 shrink-0 place-items-center rounded-full border ${done ? "border-[var(--landing-green)] bg-[var(--landing-green)] text-white" : "border-[var(--landing-line)]"}`}>
        {done && <IconCheck className="size-3" aria-hidden="true" />}
      </span>
      <span className={`min-w-0 flex-1 truncate text-xs font-medium ${done ? "text-[var(--landing-muted)] line-through" : "text-[var(--landing-ink)]"}`}>{title}</span>
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--landing-soft)] text-[9px] font-semibold text-[var(--landing-ink)]">{person}</span>
    </div>
  );
}

export function HeroCards() {
  return (
    <div className="landing-product-shell">
      <div className="flex items-center gap-2 border-b border-[var(--landing-line)] px-4 py-3 sm:px-5">
        <span className="size-2.5 rounded-full bg-[#ff6b6b]" />
        <span className="size-2.5 rounded-full bg-[#f7c948]" />
        <span className="size-2.5 rounded-full bg-[#51cf66]" />
        <div className="ml-3 flex-1 rounded-full bg-[var(--landing-soft)] px-3 py-1.5 text-[10px] text-[var(--landing-muted)]">teamlyf / Acme / projects</div>
      </div>

      <div className="grid min-h-[430px] lg:grid-cols-[190px_1fr]">
        <aside className="hidden border-r border-[var(--landing-line)] bg-[var(--landing-sidebar)] p-3 lg:block">
          <div className="mb-5 flex items-center gap-2 px-2">
            <span className="grid size-7 place-items-center rounded-lg bg-[var(--landing-ink)] text-white"><IconSparkles className="size-3.5" /></span>
            <span className="text-xs font-bold text-[var(--landing-ink)]">Teamlyf</span>
          </div>
          <p className="px-2 pb-2 text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--landing-muted)]">Workspace</p>
          <SidebarItem label="Overview" />
          <SidebarItem label="Projects" active />
          <SidebarItem label="Chat" />
          <SidebarItem label="Documents" />
          <SidebarItem label="Notes" />
          <SidebarItem label="People & HR" />
          <SidebarItem label="Calls" />
          <SidebarItem label="AI agents" />
        </aside>

        <div className="min-w-0 bg-white/80">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--landing-line)] px-4 py-4 sm:px-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--landing-muted)]">Project</p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-[var(--landing-ink)]">Product launch</h2>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-[var(--landing-muted)]">
              <span className="flex items-center gap-1.5 rounded-full border border-[var(--landing-line)] px-2.5 py-1.5"><IconUsers className="size-3" /> 8 members</span>
              <span className="flex items-center gap-1.5 rounded-full border border-[var(--landing-line)] px-2.5 py-1.5"><IconCalendar className="size-3" /> This week</span>
            </div>
          </div>

          <div className="grid gap-4 p-4 sm:grid-cols-[1fr_220px] sm:p-6">
            <div className="rounded-2xl border border-[var(--landing-line)] bg-white">
              <div className="flex items-center justify-between border-b border-[var(--landing-line)] px-3 py-3">
                <span className="text-xs font-semibold text-[var(--landing-ink)]">Tasks</span>
                <span className="rounded-full bg-[var(--landing-soft)] px-2 py-1 text-[9px] font-medium text-[var(--landing-muted)]">12 open</span>
              </div>
              <Task title="Finalize launch messaging" person="AO" />
              <Task title="Review product onboarding" person="TK" />
              <Task title="Prepare customer notes" person="JM" />
              <Task title="Publish release checklist" person="AO" done />
            </div>

            <div className="space-y-3">
              <div className="landing-mini-card">
                <div className="flex items-center justify-between"><span className="text-[10px] font-semibold text-[var(--landing-ink)]">Team activity</span><IconMessage className="size-3.5 text-[var(--landing-muted)]" /></div>
                <div className="mt-4 h-20 flex items-end gap-1.5">
                  {[35, 52, 43, 68, 56, 82, 72].map((height, index) => <span key={index} className="flex-1 rounded-t bg-[var(--landing-chart)]" style={{ height: `${height}%` }} />)}
                </div>
              </div>
              <div className="landing-mini-card">
                <div className="flex items-center gap-2"><span className="grid size-7 place-items-center rounded-full bg-[var(--landing-soft)]"><IconSparkles className="size-3.5" /></span><div><p className="text-[10px] font-semibold text-[var(--landing-ink)]">AI agent</p><p className="text-[9px] text-[var(--landing-muted)]">Launch assistant</p></div></div>
                <p className="mt-3 text-[10px] leading-4 text-[var(--landing-muted)]">Summarize project updates and turn them into the next actions.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
