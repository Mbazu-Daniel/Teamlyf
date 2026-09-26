import { useEffect, useRef, useState, type FormEvent } from "react";
import { IconArrowsMaximize, IconArrowsMinimize, IconX, IconGripVertical } from "@tabler/icons-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Status } from "@/lib/api";
import { ErrorMessage, MutedMessage } from "./feedback";
import { TaskActivity } from "./task-activity";
import { TaskComments } from "./task-comments";
import { TaskProperties } from "./task-detail-properties";
import { useTaskDetail } from "./use-task-detail";

export type TaskDetailPanelProps = {
  organizationId: string;
  projectId: string;
  taskId: string | null;
  statuses: Status[];
  onClose: () => void;
};

export function TaskDetailPanel({ organizationId, projectId, taskId, statuses, onClose }: TaskDetailPanelProps) {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const update = () => setMobile(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (taskId === null) return null;

  if (mobile) {
    return (
      <>
        <div className="fixed inset-0 z-40 bg-black/[0.03]" onClick={onClose} />
        <aside className="fixed inset-y-0 right-0 z-50 flex h-svh w-full flex-col border-l bg-background shadow-2xl">
          <div className="flex items-center justify-between border-b bg-background px-5 py-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Task details</span>
            <button type="button" onClick={onClose} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
              <IconX className="size-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <TaskDetailContent organizationId={organizationId} projectId={projectId} taskId={taskId} statuses={statuses} onClose={onClose} mobile />
          </div>
        </aside>
      </>
    );
  }

  return <DesktopTaskPanel organizationId={organizationId} projectId={projectId} taskId={taskId} statuses={statuses} onClose={onClose} />;
}

function DesktopTaskPanel(props: Omit<TaskDetailPanelProps, "taskId"> & { taskId: string }) {
  const [width, setWidth] = useState(600);
  const [maximized, setMaximized] = useState(false);
  const resizing = useRef(false);

  useEffect(() => {
    const move = (event: MouseEvent) => {
      if (!resizing.current || maximized) return;
      const next = window.innerWidth - event.clientX;
      if (next >= 400 && next <= window.innerWidth * 0.8) setWidth(next);
    };
    const stop = () => {
      resizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", stop);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", stop);
    };
  }, [maximized]);

  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") props.onClose();
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [props.onClose]);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/[0.03]" onClick={props.onClose} />
      <aside
        style={{ width: maximized ? "100%" : `${width}px` }}
        className="fixed right-0 top-0 z-50 flex h-svh flex-col border-l border-border bg-background shadow-2xl"
      >
        {!maximized && (
          <button
            type="button"
            aria-label="Resize task panel"
            onMouseDown={() => {
              resizing.current = true;
              document.body.style.cursor = "col-resize";
              document.body.style.userSelect = "none";
            }}
            className="absolute left-0 top-0 z-10 flex h-full w-2 cursor-col-resize items-center justify-center hover:bg-primary/10"
          >
            <IconGripVertical className="size-3 text-muted-foreground opacity-0 hover:opacity-100" />
          </button>
        )}
        <div className="flex items-center justify-between border-b px-5 py-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Task details</span>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setMaximized((value) => !value)} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={maximized ? "Restore" : "Maximize"}>
              {maximized ? <IconArrowsMinimize className="size-4" /> : <IconArrowsMaximize className="size-4" />}
            </button>
            <button type="button" onClick={props.onClose} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close">
              <IconX className="size-4" />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <TaskDetailContent {...props} />
        </div>
      </aside>
    </>
  );
}

function TaskDetailContent({
  organizationId,
  projectId,
  taskId,
  statuses,
}: Omit<TaskDetailPanelProps, "taskId"> & { taskId: string; mobile?: boolean }) {
  const detail = useTaskDetail(organizationId, projectId, taskId);
  const task = detail.task;

  return (
    <div className="space-y-6 p-5 sm:p-6">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{task ? `Task #${task.sequenceId}` : "Task"}</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">{task?.name ?? "Loading task..."}</h2>
        {task?.description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{task.description}</p>}
      </header>

      {detail.loading && <Skeleton className="h-40 w-full" />}
      {detail.error && <ErrorMessage message={detail.error} />}
      {task && (
        <>
          {detail.saveError && <ErrorMessage message={detail.saveError} />}
          <TaskDetailsForm detail={detail} />
          <TaskProperties organizationId={organizationId} projectId={projectId} task={task} statuses={statuses} members={detail.members} membersLoading={detail.membersLoading} updateTask={detail.updateTask} />
          <TaskComments organizationId={organizationId} projectId={projectId} taskId={taskId} />
          <TaskActivity organizationId={organizationId} projectId={projectId} taskId={taskId!} />
          {detail.saving && <MutedMessage message="Saving your change..." />}
        </>
      )}
    </div>
  );
}

type TaskDetail = ReturnType<typeof useTaskDetail>;

function TaskDetailsForm({ detail }: { detail: TaskDetail }) {
  const task = detail.task!;
  const [name, setName] = useState(task.name);
  const [description, setDescription] = useState(task.description ?? "");

  useEffect(() => {
    setName(task.name);
    setDescription(task.description ?? "");
  }, [task]);

  function save(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || detail.saving || (name === task.name && description === (task.description ?? ""))) return;
    detail.updateTask({ name: name.trim(), description });
  }

  return (
    <form onSubmit={save} className="space-y-3 rounded-xl border border-border/70 bg-card p-4">
      <input value={name} onChange={(event) => setName(event.target.value)} className="w-full border-0 bg-transparent px-0 text-lg font-semibold outline-none" aria-label="Task name" />
      <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} placeholder="Add a description..." className="w-full resize-none rounded-lg border bg-background p-3 text-sm outline-none focus:border-primary" />
      <button type="submit" disabled={detail.saving || !name.trim()} className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">
        {detail.saving ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
