import { useState, type FormEvent } from "react";
import type { Milestone } from "@/lib/api";
import { IconCalendar, IconFlag, IconPlus, IconTrash } from "@tabler/icons-react";
import { MutedMessage } from "./feedback";

type CreateMilestone = (input: {
  name: string;
  description?: string;
  startDate?: string;
  targetDate?: string;
}) => void;

export function MilestonesSection({
  milestones,
  loading,
  createMilestone,
  deleteMilestone,
}: {
  milestones: Milestone[];
  loading: boolean;
  createMilestone: CreateMilestone;
  deleteMilestone: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-2xl border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4 sm:px-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Roadmap</p>
          <h2 className="mt-1 text-base font-semibold">Milestones</h2>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition hover:bg-muted"
        >
          <IconPlus className="size-3.5" />
          Add milestone
        </button>
      </div>

      {open && (
        <MilestoneForm
          loading={loading}
          onCancel={() => setOpen(false)}
          onCreate={(input) => {
            createMilestone(input);
            setOpen(false);
          }}
        />
      )}

      <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {milestones.map((milestone) => (
          <MilestoneCard key={milestone.id} milestone={milestone} onDelete={() => deleteMilestone(milestone.id)} />
        ))}
        {!loading && milestones.length === 0 && (
          <MutedMessage className="p-2 sm:col-span-2 lg:col-span-3" message="No milestones yet. Add the first delivery checkpoint." />
        )}
        {loading && <MutedMessage className="p-2" message="Loading milestones..." />}
      </div>
    </section>
  );
}

function MilestoneForm({
  loading,
  onCancel,
  onCreate,
}: {
  loading: boolean;
  onCancel: () => void;
  onCreate: CreateMilestone;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [targetDate, setTargetDate] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    onCreate({
      name: name.trim(),
      description: description.trim() || undefined,
      startDate: startDate || undefined,
      targetDate: targetDate || undefined,
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-2 border-b bg-muted/20 p-4 sm:grid-cols-2">
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Milestone name" className="rounded-lg border bg-background px-3 py-2 text-sm" required />
      <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description (optional)" className="rounded-lg border bg-background px-3 py-2 text-sm" />
      <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm" />
      <input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm" />
      <div className="flex gap-2 sm:col-span-2">
        <button disabled={loading} className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">{loading ? "Creating..." : "Create milestone"}</button>
        <button type="button" onClick={onCancel} className="rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-muted">Cancel</button>
      </div>
    </form>
  );
}

function MilestoneCard({ milestone, onDelete }: { milestone: Milestone; onDelete: () => void }) {
  return (
    <article className="rounded-xl border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <IconFlag className="size-3.5" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold">{milestone.name}</h3>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{formatStatus(milestone.status)}</p>
          </div>
        </div>
        <button type="button" onClick={onDelete} aria-label={`Delete milestone ${milestone.name}`} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
          <IconTrash className="size-3.5" />
        </button>
      </div>
      {milestone.description && <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">{milestone.description}</p>}
      <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
        {milestone.startDate && <span className="inline-flex items-center gap-1"><IconCalendar className="size-3" />{formatDate(milestone.startDate)}</span>}
        {milestone.targetDate && <span className="inline-flex items-center gap-1">→ {formatDate(milestone.targetDate)}</span>}
      </div>
    </article>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatStatus(value: string) {
  return value.replace(/-/g, " ");
}
