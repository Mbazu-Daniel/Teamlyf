import { useMemo, useState, type FormEvent } from "react";
import type { Milestone, MilestoneStatus, ProjectTask } from "@/lib/api";
import { IconCalendar, IconCheck, IconFlag, IconPencil, IconPlus, IconTrash } from "@tabler/icons-react";
import { MutedMessage } from "./feedback";

type MilestoneInput = {
  name: string;
  description?: string;
  status?: MilestoneStatus;
  startDate?: string;
  targetDate?: string;
};

const statuses: MilestoneStatus[] = ["backlog", "planned", "in-progress", "paused", "completed", "cancelled"];

export function MilestonesSection({
  milestones,
  tasks,
  loading,
  statuses,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  addTaskToMilestone,
  removeTaskFromMilestone,
}: {
  milestones: Milestone[];
  tasks: ProjectTask[];
  loading: boolean;
  statuses: Array<{ id: string; group: string }>;
  createMilestone: (input: MilestoneInput) => void;
  updateMilestone: (input: MilestoneInput & { milestoneId: string }) => void;
  deleteMilestone: (id: string) => void;
  addTaskToMilestone: (input: { milestoneId: string; taskId: string }) => void;
  removeTaskFromMilestone: (input: { milestoneId: string; taskId: string }) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-2xl border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4 sm:px-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Roadmap</p>
          <h2 className="mt-1 text-base font-semibold">Milestones</h2>
        </div>
        <button type="button" onClick={() => setOpen((value) => !value)} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition hover:bg-muted">
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

      <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {milestones.map((milestone) => (
          <MilestoneCard
            key={milestone.id}
            milestone={milestone}
            tasks={tasks}
            statuses={statuses}
            onUpdate={updateMilestone}
            onDelete={() => deleteMilestone(milestone.id)}
            onAddTask={addTaskToMilestone}
            onRemoveTask={removeTaskFromMilestone}
          />
        ))}
        {!loading && milestones.length === 0 && (
          <MutedMessage className="p-3 sm:col-span-2 lg:col-span-3" message="No milestones yet. Add a delivery checkpoint and connect work to it." />
        )}
        {loading && <MutedMessage className="p-3" message="Loading milestones..." />}
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
  onCreate: (input: MilestoneInput) => void;
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

function MilestoneCard({
  milestone,
  tasks,
  onUpdate,
  onDelete,
  onAddTask,
  onRemoveTask,
}: {
  milestone: Milestone;
  tasks: ProjectTask[];
  statuses: Array<{ id: string; group: string }>;
  onUpdate: (input: MilestoneInput & { milestoneId: string }) => void;
  onDelete: () => void;
  onAddTask: (input: { milestoneId: string; taskId: string }) => void;
  onRemoveTask: (input: { milestoneId: string; taskId: string }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [taskPickerOpen, setTaskPickerOpen] = useState(false);
  const taskIds = new Set((milestone.milestoneTasks ?? []).map((item) => item.taskId));
  const linkedTasks = tasks.filter((task) => taskIds.has(task.id));
  const completed = linkedTasks.filter((task) => {
    const status = statuses.find((item) => item.id === task.statusId);
    return status?.group === "done";
  }).length;
  const progress = linkedTasks.length ? Math.round((completed / linkedTasks.length) * 100) : 0;

  return (
    <article className="rounded-xl border bg-background p-3">
      {editing ? (
        <MilestoneEditForm
          milestone={milestone}
          onCancel={() => setEditing(false)}
          onSave={(input) => {
            onUpdate({ milestoneId: milestone.id, ...input });
            setEditing(false);
          }}
        />
      ) : (
        <>
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
            <div className="flex items-center gap-0.5">
              <button type="button" onClick={() => setEditing(true)} aria-label={`Edit milestone ${milestone.name}`} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                <IconPencil className="size-3.5" />
              </button>
              <button type="button" onClick={onDelete} aria-label={`Delete milestone ${milestone.name}`} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                <IconTrash className="size-3.5" />
              </button>
            </div>
          </div>

          {milestone.description && <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">{milestone.description}</p>}

          <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
            {milestone.startDate && <span className="inline-flex items-center gap-1"><IconCalendar className="size-3" />{formatDate(milestone.startDate)}</span>}
            {milestone.targetDate && <span className="inline-flex items-center gap-1">→ {formatDate(milestone.targetDate)}</span>}
            <span className="inline-flex items-center gap-1"><IconCheck className="size-3" />{linkedTasks.length} tasks</span>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${milestone.status === "completed" ? 100 : progress}%` }} />
          </div>

          <button type="button" onClick={() => setTaskPickerOpen((value) => !value)} className="mt-3 text-xs font-semibold text-primary hover:underline">
            {taskPickerOpen ? "Hide task picker" : "Manage tasks"}
          </button>

          {taskPickerOpen && (
            <div className="mt-2 space-y-1.5 rounded-lg border bg-muted/20 p-2">
              {tasks.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">Create tasks first.</p>
              ) : (
                tasks.map((task) => {
                  const linked = taskIds.has(task.id);
                  return (
                    <label key={task.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-background">
                      <input
                        type="checkbox"
                        checked={linked}
                        onChange={() => linked
                          ? onRemoveTask({ milestoneId: milestone.id, taskId: task.id })
                          : onAddTask({ milestoneId: milestone.id, taskId: task.id })}
                      />
                      <span className="min-w-0 flex-1 truncate text-[11px]">{task.name}</span>
                    </label>
                  );
                })
              )}
            </div>
          )}
        </>
      )}
    </article>
  );
}

function MilestoneEditForm({
  milestone,
  onCancel,
  onSave,
}: {
  milestone: Milestone;
  onCancel: () => void;
  onSave: (input: MilestoneInput) => void;
}) {
  const [name, setName] = useState(milestone.name);
  const [status, setStatus] = useState<MilestoneStatus>(normalizeStatus(milestone.status));
  const [description, setDescription] = useState(milestone.description ?? "");
  const [startDate, setStartDate] = useState(dateInput(milestone.startDate));
  const [targetDate, setTargetDate] = useState(dateInput(milestone.targetDate));

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (!name.trim()) return;
        onSave({ name: name.trim(), description: description.trim() || undefined, status, startDate: startDate || undefined, targetDate: targetDate || undefined });
      }}
      className="space-y-2"
    >
      <input value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
      <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
      <select value={status} onChange={(event) => setStatus(event.target.value as MilestoneStatus)} className="w-full rounded-lg border bg-background px-3 py-2 text-xs">
        {statuses.map((item) => <option key={item} value={item}>{formatStatus(item)}</option>)}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="rounded-lg border bg-background px-3 py-2 text-xs" />
        <input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} className="rounded-lg border bg-background px-3 py-2 text-xs" />
      </div>
      <div className="flex gap-2">
        <button className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">Save</button>
        <button type="button" onClick={onCancel} className="rounded-lg border px-3 py-2 text-xs font-semibold">Cancel</button>
      </div>
    </form>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function formatStatus(value: string) {
  return value.replace(/-/g, " ");
}

function normalizeStatus(value: string): MilestoneStatus {
  return statuses.includes(value as MilestoneStatus) ? value as MilestoneStatus : "planned";
}

function dateInput(value: string | null) {
  return value ? value.slice(0, 10) : "";
}
