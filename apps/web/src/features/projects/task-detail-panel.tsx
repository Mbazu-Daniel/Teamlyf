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

function TaskDetailContent({
  organizationId,
  projectId,
  taskId,
  statuses,
}: TaskDetailContentProps) {
  const detail = useTaskDetail(organizationId, projectId, taskId);
  const task = detail.task;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (task) {
      setName(task.name);
      setDescription(task.description ?? "");
    }
  }, [task]);

  const savedDescription = task?.description ?? "";
  const dirty = task !== null && (name !== task.name || description !== savedDescription);

  function saveDetails(event: FormEvent) {
    event.preventDefault();
    if (!dirty || !name.trim() || detail.saving) return;
    detail.updateTask({ name: name.trim(), description });
  }

  return (
    <DialogContent className="left-auto right-0 top-0 h-full w-full max-h-full translate-x-0 translate-y-0 rounded-none border-y-0 border-r-0 sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{task?.name ?? "Task"}</DialogTitle>
        <DialogDescription>{task ? `Task #${task.sequenceId}` : "Loading task"}</DialogDescription>
      </DialogHeader>
      {detail.loading && <Skeleton className="h-40 w-full" />}
      {detail.error && <ErrorMessage message={detail.error} />}
      {task && (
        <>
          {detail.saveError && <ErrorMessage message={detail.saveError} />}
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
              disabled={!dirty || detail.saving || !name.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
            >
              {detail.saving ? "Saving..." : "Save changes"}
            </button>
          </form>
          <TaskProperties
            task={task}
            statuses={statuses}
            members={detail.members}
            membersLoading={detail.membersLoading}
            updateTask={detail.updateTask}
          />
          <TaskComments organizationId={organizationId} projectId={projectId} taskId={taskId} />
          <TaskActivity organizationId={organizationId} projectId={projectId} taskId={taskId} />
          {detail.saving && <MutedMessage message="Saving your change..." />}
        </>
      )}
    </DialogContent>
  );
}
