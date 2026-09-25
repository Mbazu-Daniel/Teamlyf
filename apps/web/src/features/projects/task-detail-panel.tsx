import { useEffect, useState, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  /** Selected task id from `?task=`; null keeps the panel closed. */
  taskId: string | null;
  statuses: Status[];
  onClose: () => void;
};

export function TaskDetailPanel({
  organizationId,
  projectId,
  taskId,
  statuses,
  onClose,
}: TaskDetailPanelProps) {
  return (
    <Dialog
      open={taskId !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {taskId !== null && (
        <TaskDetailContent
          organizationId={organizationId}
          projectId={projectId}
          taskId={taskId}
          statuses={statuses}
        />
      )}
    </Dialog>
  );
}

type TaskDetailContentProps = Omit<TaskDetailPanelProps, "taskId" | "onClose"> & { taskId: string };

type TaskDetail = ReturnType<typeof useTaskDetail>;

function TaskDetailContent({
  organizationId,
  projectId,
  taskId,
  statuses,
}: TaskDetailContentProps) {
  const detail = useTaskDetail(organizationId, projectId, taskId);
  const heading = taskHeading(detail.task);

  return (
    <DialogContent className="left-auto right-0 top-0 h-full w-full max-h-full translate-x-0 translate-y-0 rounded-none border-y-0 border-r-0 sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{heading.title}</DialogTitle>
        <DialogDescription>{heading.caption}</DialogDescription>
      </DialogHeader>
      {detail.loading && <Skeleton className="h-40 w-full" />}
      {detail.error && <ErrorMessage message={detail.error} />}
      {detail.task && (
        <LoadedTaskDetail
          detail={detail}
          organizationId={organizationId}
          projectId={projectId}
          taskId={taskId}
          statuses={statuses}
        />
      )}
    </DialogContent>
  );
}

/** The panel's own body, mounted only once a task has actually loaded. */
function LoadedTaskDetail({
  detail,
  organizationId,
  projectId,
  taskId,
  statuses,
}: {
  detail: TaskDetail;
} & Omit<TaskDetailContentProps, keyof TaskDetail>) {
  return (
    <>
      {detail.saveError && <ErrorMessage message={detail.saveError} />}
      <TaskDetailsForm detail={detail} />
      <TaskProperties
        task={detail.task!}
        statuses={statuses}
        members={detail.members}
        membersLoading={detail.membersLoading}
        updateTask={detail.updateTask}
      />
      <TaskComments organizationId={organizationId} projectId={projectId} taskId={taskId} />
      <TaskActivity organizationId={organizationId} projectId={projectId} taskId={taskId} />
      {detail.saving && <MutedMessage message="Saving your change..." />}
    </>
  );
}

/** Name and description, seeded from the task and re-seeded when it changes. */
function TaskDetailsForm({ detail }: { detail: TaskDetail }) {
  const task = detail.task!;
  const [name, setName] = useState(task.name);
  const [description, setDescription] = useState(asText(task.description));

  useEffect(() => {
    setName(task.name);
    setDescription(asText(task.description));
  }, [task]);

  const canSave = canSaveDetails(task, name, description, detail.saving);

  function saveDetails(event: FormEvent) {
    event.preventDefault();
    if (!canSave) return;
    detail.updateTask({ name: name.trim(), description });
  }

  return (
    <form onSubmit={saveDetails} className="space-y-3">
      <div className="space-y-1">
        <label htmlFor="task-name" className="text-sm text-muted-foreground">
          Name
        </label>
        <input
          id="task-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="task-description" className="text-sm text-muted-foreground">
          Description
        </label>
        <textarea
          id="task-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={!canSave}
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
      >
        {detail.saving ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}

/** An absent description edits as an empty string rather than as "undefined". */
function asText(value: string | null | undefined) {
  return value ?? "";
}

/** Dialog header copy, with placeholders for the states that have no task yet. */
function taskHeading(task: TaskDetail["task"]) {
  return {
    title: task?.name ?? "Task",
    caption: task ? `Task #${task.sequenceId}` : "Loading task",
  };
}

/** Whether the save button should be live: something changed, it has a name, and no write is in flight. */
function canSaveDetails(
  task: NonNullable<TaskDetail["task"]>,
  name: string,
  description: string,
  saving: boolean,
) {
  const dirty = name !== task.name || description !== asText(task.description);
  return dirty && name.trim() !== "" && !saving;
}
