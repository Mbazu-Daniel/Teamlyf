import { IconCopy, IconDots, IconPin, IconPencil, IconTrash } from "@tabler/icons-react";
import type { ProjectTask } from "@/lib/api";

type TaskActionsMenuProps = {
  task: ProjectTask;
  onEdit: (task: ProjectTask) => void;
  onDelete?: (task: ProjectTask) => void;
  onDuplicate?: (task: ProjectTask) => void;
};

export function TaskActionsMenu({ task, onEdit, onDelete, onDuplicate }: TaskActionsMenuProps) {
  return (
    <details className="relative shrink-0" onClick={(event) => event.stopPropagation()}>
      <summary className="list-none cursor-pointer rounded-md p-1 hover:bg-accent">
        <IconDots className="size-4 text-muted-foreground" />
      </summary>
      <div className="absolute right-0 z-30 mt-1 w-48 rounded-xl border bg-popover p-1.5 shadow-xl">
        <button type="button" onClick={() => onEdit(task)} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs hover:bg-accent">
          <IconPencil className="size-3.5" />Edit
        </button>
        {onDuplicate && (
          <button type="button" onClick={() => onDuplicate(task)} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs hover:bg-accent">
            <IconCopy className="size-3.5" />Duplicate
          </button>
        )}
        <button type="button" className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs hover:bg-accent">
          Convert to subtask
        </button>
        <button type="button" className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs hover:bg-accent">
          <IconPin className="size-3.5" />Pin task to dashboard
        </button>
        <div className="my-1 border-t" />
        {onDelete && (
          <button type="button" onClick={() => onDelete(task)} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-destructive hover:bg-destructive/10">
            <IconTrash className="size-3.5" />Delete
          </button>
        )}
      </div>
    </details>
  );
}
