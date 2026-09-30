import { useState } from "react";
import { IconCircleCheck, IconLayoutKanban, IconList } from "@tabler/icons-react";
import type { ProjectTask, Status } from "@/lib/api";
import { GroupedBoard } from "./board";
import { MutedMessage } from "./feedback";
import { TaskDetailPanel } from "./task-detail-panel";
import { TaskList } from "./task-list";
import type { TaskView } from "./task-search";
import { useMyTasks, ALL_ASSIGNEES } from "./use-my-tasks";
import {
  PageEmptyState,
  PageToolbar,
  ToolbarSearch,
  ViewToggle,
  pageInput,
  pagePrimaryAction,
} from "@/components/workspace/page-layout";
import { CreateTask } from "./create-task";
import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

type TasksPageProps = Readonly<{
  organizationId: string | undefined;

  view: TaskView;
  onViewChange: (view: TaskView) => void;
  selectedTaskId: string | null;
  onSelectTask: (task: ProjectTask) => void;
  onCloseTask: () => void;
}>;

export function TasksPage({
  organizationId,
  view,
  onViewChange,
  selectedTaskId,
  onSelectTask,
  onCloseTask,
}: TasksPageProps) {
  const [search, setSearch] = useState("");
  const [assignee, setAssignee] = useState<string>("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [priority, setPriority] = useState("all");
  const [creating, setCreating] = useState(false);
  const projects = useQuery({
    queryKey: queryKeys.projects(organizationId ?? ""),
    queryFn: () => projectsApi.getProjects(organizationId!),
    enabled: !!organizationId,
  });
  const {
    rows,
    assigneeOptions,
    currentMemberId,
    groups,
    columns,
    loading,
    error,
    statusesByProjectId,
    moveToStatus,
    reschedule,
    deleteTask,
    duplicateTask,
  } = useMyTasks(organizationId, search, {
    assigneeId: assignee || undefined,
    projectFilter,
    priority,
  });
  const selectedRow = selectedTaskId
    ? rows.find((row) => row.task.id === selectedTaskId)
    : undefined;
  const filteringByMember = Boolean(assignee) && assignee !== currentMemberId;
  const searching =
    search.trim().length > 0 ||
    projectFilter !== "all" ||
    priority !== "all" ||
    filteringByMember ||
    assignee === ALL_ASSIGNEES;

  function statusesFor(task: ProjectTask): Status[] {
    const row = rows.find((item) => item.task.id === task.id);
    return row ? (statusesByProjectId.get(row.projectId) ?? []) : [];
  }

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[1440px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
      <PageToolbar>
        <ViewToggle
          value={view}
          onChange={onViewChange}
          ariaLabel="Task view"
          options={[
            { value: "board", label: "Board", icon: IconLayoutKanban },
            { value: "list", label: "List", icon: IconList },
          ]}
        />
        <ToolbarSearch
          value={search}
          onChange={setSearch}
          placeholder="Search tasks…"
          label="Search tasks"
        />
        <select
          aria-label="Filter by assignee"
          className={`${pageInput} !w-auto cursor-pointer`}
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
        >
          {/* Empty means "me", so the default view is your own work. */}
          <option value="">Your tasks</option>
          <option value={ALL_ASSIGNEES}>Everyone</option>
          {assigneeOptions.map((option: { id: string; name: string }) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by project"
          className={`${pageInput} !w-auto cursor-pointer`}
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
        >
          <option value="all">All projects</option>
          {projects.data?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by priority"
          className={`${pageInput} !w-auto cursor-pointer capitalize`}
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          {["all", "none", "low", "medium", "high", "urgent"].map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <button
          className={`${pagePrimaryAction} cursor-pointer`}
          disabled={!organizationId}
          onClick={() => setCreating(true)}
        >
          Create task
        </button>
      </PageToolbar>

      {creating && organizationId && (
        <CreateTask org={organizationId} onClose={() => setCreating(false)} />
      )}

      <main
        className={`scrollbar-hidden min-h-0 overflow-auto rounded-[16px] border border-border/70 bg-card p-4 sm:p-5 ${view === "board" && rows.length > 0 ? "shrink-0" : "flex-1"}`}
      >
        {error ? (
          <MutedMessage message={error} />
        ) : loading ? (
          <MutedMessage message="Loading your tasks…" />
        ) : rows.length === 0 ? (
          searching ? (
            <MutedMessage
              className="rounded-xl border border-dashed p-10 text-center"
              message="No tasks match these filters."
            />
          ) : (
            <PageEmptyState
              icon={IconCircleCheck}
              title="Nothing is assigned to you"
              description="Tasks assigned to you across every project will show up here."
              className="h-full"
            />
          )
        ) : view === "board" ? (
          <GroupedBoard
            columns={columns}
            allTasks={rows.map((row) => row.task)}
            statusesFor={statusesFor}
            onMove={moveToStatus}
            onDropColumn={reschedule}
            onSelect={onSelectTask}
            onDelete={deleteTask}
            onDuplicate={duplicateTask}
          />
        ) : (
          <TaskList
            groups={groups}
            onSelect={onSelectTask}
            onDelete={deleteTask}
            onDuplicate={duplicateTask}
          />
        )}
      </main>

      {selectedRow && (
        <TaskDetailPanel
          organizationId={organizationId ?? ""}
          projectId={selectedRow.projectId}
          taskId={selectedRow.task.id}
          statuses={statusesByProjectId.get(selectedRow.projectId) ?? []}
          onClose={onCloseTask}
        />
      )}
    </div>
  );
}
