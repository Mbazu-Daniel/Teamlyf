import { Fragment, useMemo, useState } from "react";
import { IconChartBar, IconChevronDown, IconChevronUp, IconSelector } from "@tabler/icons-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { ProjectTask, Status } from "@/lib/api";
import { cn } from "@/lib/utils";
import { MutedMessage } from "./feedback";
import { dueTone, type TaskListGroup, type TaskListRow } from "./task-groups";
import { TaskActionsMenu } from "./task-actions-menu";

/**
 * The Linear/Jira-style table: one dense, sortable, selectable grid for both
 * the project List view and My Tasks. Callers decide the sections — a flat
 * project backlog passes one unlabelled group, My Tasks passes date buckets.
 */
const priorityTone: Record<string, string> = { urgent: "text-destructive", high: "text-orange-500", medium: "text-amber-500", low: "text-blue-500", none: "text-muted-foreground" };

type SortKey = "title" | "status" | "due" | "start";
type SortState = Readonly<{ key: SortKey; dir: "asc" | "desc" }>;

const HEADER_CELL = "h-11 px-4 text-left align-middle text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground";
const ROW_CELL = "h-16 px-4 align-middle";

export function TaskList({ groups, onSelect, onDelete, onDuplicate, emptyMessage = "No tasks match your current view." }: {
  groups: readonly TaskListGroup[];
  onSelect: (task: ProjectTask) => void;
  onDelete?: (task: ProjectTask) => void;
  onDuplicate?: (task: ProjectTask) => void;
  emptyMessage?: string;
}) {
  const [sort, setSort] = useState<SortState>({ key: "due", dir: "asc" });
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());

  const sorted = useMemo(() => groups.map((group) => ({ ...group, rows: [...group.rows].sort((a, b) => compare(a, b, sort)) })), [groups, sort]);
  const visibleIds = useMemo(() => sorted.flatMap((group) => group.rows.map((row) => row.task.id)), [sorted]);
  const selectedCount = visibleIds.filter((id) => selected.has(id)).length;
  const allSelected = visibleIds.length > 0 && selectedCount === visibleIds.length;
  const showProject = sorted.some((group) => group.rows.some((row) => row.project));
  const columnCount = 6 + (showProject ? 1 : 0);

  if (!visibleIds.length) return <MutedMessage className="rounded-xl border border-dashed p-10 text-center" message={emptyMessage} />;

  function toggleSort(key: SortKey) {
    setSort((current) => current.key === key ? { key, dir: current.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });
  }

  function toggleSelected(taskId: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(taskId);
      else next.delete(taskId);
      return next;
    });
  }

  function toggleAll() {
    setSelected((current) => {
      const next = new Set(current);
      for (const id of visibleIds) {
        if (allSelected) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }

  function sortHeader(key: SortKey, label: string, className?: string) {
    const active = sort.key === key;
    return (
      <th scope="col" aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"} className={cn(HEADER_CELL, className)}>
        <button type="button" onClick={() => toggleSort(key)} className={cn("inline-flex items-center gap-1 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40", active ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
          {label}
          {active ? (sort.dir === "asc" ? <IconChevronUp className="size-3" /> : <IconChevronDown className="size-3" />) : <IconSelector className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />}
        </button>
      </th>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[14px] border border-border/70 bg-card">
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[480px] table-fixed border-collapse text-[13px]">
          <thead className="sticky top-0 z-10 border-b border-border/70 bg-muted">
            <tr className="group">
              <th scope="col" className={cn(HEADER_CELL, "w-10 pl-4")}>
                <Checkbox checked={allSelected} indeterminate={selectedCount > 0 && !allSelected} onCheckedChange={toggleAll} aria-label="Select all tasks" />
              </th>
              {sortHeader("title", "Task")}
              {showProject && <th scope="col" className={cn(HEADER_CELL, "hidden w-44 md:table-cell")}>Project</th>}
              {sortHeader("status", "Status", "w-32")}
              {sortHeader("due", "Due", "w-24")}
              {sortHeader("start", "Start", "hidden w-28 xl:table-cell")}
              <th scope="col" className={cn(HEADER_CELL, "w-10")}><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((group) => (
              <Fragment key={group.id}>
                {group.label && (
                  <tr>
                    <td colSpan={columnCount} className="h-10 border-y border-border/60 bg-muted/25 px-4">
                      <span className="flex items-center gap-2">
                        <span className={cn("text-xs font-semibold", group.labelClassName)}>{group.label}</span>
                        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{group.rows.length}</span>
                      </span>
                    </td>
                  </tr>
                )}
                {group.rows.map((row) => (
                  <TaskRow key={row.task.id} row={row} selected={selected.has(row.task.id)} onSelectedChange={toggleSelected} onSelect={onSelect} onDelete={onDelete} onDuplicate={onDuplicate} />
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex h-9 shrink-0 items-center justify-between border-t px-4 text-[11px] text-muted-foreground">
        <span>{visibleIds.length} task{visibleIds.length === 1 ? "" : "s"}</span>
        {selectedCount > 0 && (
          <span className="flex items-center gap-2">
            <span>{selectedCount} selected</span>
            <button type="button" onClick={() => setSelected(new Set())} className="font-medium text-primary hover:underline">Clear</button>
          </span>
        )}
      </div>
    </div>
  );
}

function TaskRow({ row, selected, onSelectedChange, onSelect, onDelete, onDuplicate }: {
  row: TaskListRow;
  selected: boolean;
  onSelectedChange: (taskId: string, checked: boolean) => void;
  onSelect: (task: ProjectTask) => void;
  onDelete?: (task: ProjectTask) => void;
  onDuplicate?: (task: ProjectTask) => void;
}) {
  const { task, status, project } = row;
  return (
    <tr onClick={() => onSelect(task)} className={cn("group cursor-pointer border-b border-border/50 transition-colors last:border-b-0 hover:bg-primary/[0.035]", selected && "bg-primary/5")}>
      <td className={cn(ROW_CELL, "pl-4")}>
        <Checkbox checked={selected} onCheckedChange={(checked) => onSelectedChange(task.id, checked)} onClick={(event) => event.stopPropagation()} aria-label={`Select ${task.name}`} />
      </td>
      <td className={ROW_CELL}>
        <div className="flex min-w-0 items-center gap-2">
          <IconChartBar className={cn("size-3.5 shrink-0", priorityTone[task.priority] ?? priorityTone.none)} aria-label={`Priority ${task.priority}`} />
          <button type="button" onClick={(event) => { event.stopPropagation(); onSelect(task); }} className="min-w-0 flex-1 truncate rounded-sm text-left text-sm font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary/40">
            {task.name}
          </button>
        </div>
      </td>
      {project && (
        <td className={cn(ROW_CELL, "hidden md:table-cell")}>
          <span className="flex min-w-0 items-center gap-2">
            <span className="grid size-5 shrink-0 place-items-center rounded bg-muted text-[10px]">{project.emoji || project.name.charAt(0).toUpperCase()}</span>
            <span className="truncate text-xs text-muted-foreground">{project.name}</span>
          </span>
        </td>
      )}
      <td className={cn(ROW_CELL, "w-32")}><StatusPill status={status} /></td>
      <td className={cn(ROW_CELL, "w-24 text-xs tabular-nums", dueTone(task))}>{formatDate(task.targetDate, false) ?? "—"}</td>
      <td className={cn(ROW_CELL, "hidden w-28 text-xs tabular-nums text-muted-foreground xl:table-cell")}>{formatDate(task.startDate, true) ?? "—"}</td>
      <td className={cn(ROW_CELL, "w-10 text-right")} onClick={(event) => event.stopPropagation()}>
        {(onDelete || onDuplicate) && (
          <span className="inline-flex opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <TaskActionsMenu task={task} onEdit={() => onSelect(task)} onDelete={onDelete} onDuplicate={onDuplicate} />
          </span>
        )}
      </td>
    </tr>
  );
}

function StatusPill({ status }: { status?: Status }) {
  if (!status) return <span className="text-xs text-muted-foreground">—</span>;
  const hex = /^#[0-9a-f]{6}$/i.test(status.color) ? status.color : null;
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium capitalize" style={hex ? { color: hex, backgroundColor: `${hex}12`, borderColor: `${hex}35` } : undefined}>
      <span className="size-1.5 shrink-0 rounded-full bg-current" />
      <span className="truncate">{status.name.replace(/[_-]+/g, " ")}</span>
    </span>
  );
}

function formatDate(value: string | null, withYear: boolean): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, withYear ? { month: "short", day: "numeric", year: "numeric" } : { month: "short", day: "numeric" });
}

function compare(a: TaskListRow, b: TaskListRow, sort: SortState): number {
  const sign = sort.dir === "asc" ? 1 : -1;
  const [left, right] = sortValues(a, b, sort.key);
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  if (typeof left === "string" || typeof right === "string") return String(left).localeCompare(String(right)) * sign;
  return (left - right) * sign;
}

/** Undated rows always sink to the bottom, whichever way the column is sorted. */
function sortValues(a: TaskListRow, b: TaskListRow, key: SortKey): [string | number | null, string | number | null] {
  if (key === "title") return [a.task.name.toLowerCase(), b.task.name.toLowerCase()];
  if (key === "status") return [(a.status?.name ?? "").toLowerCase(), (b.status?.name ?? "").toLowerCase()];
  const value = key === "due" ? a.task.targetDate : a.task.startDate;
  const other = key === "due" ? b.task.targetDate : b.task.startDate;
  return [value ? new Date(value).getTime() : null, other ? new Date(other).getTime() : null];
}
