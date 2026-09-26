import { IconCopy, IconDots, IconPencil, IconTrash } from "@tabler/icons-react";
import type { ProjectTask } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TaskActionsMenuProps = {
  task: ProjectTask;
  onEdit: (task: ProjectTask) => void;
  onDelete?: (task: ProjectTask) => void;
  onDuplicate?: (task: ProjectTask) => void;
};

export function TaskActionsMenu({ task, onEdit, onDelete, onDuplicate }: TaskActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<button type="button" aria-label={`Actions for ${task.name}`} />}
        className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        onClick={(event) => event.stopPropagation()}
      >
        <IconDots className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(task)}>
          <IconPencil />
          Edit
        </DropdownMenuItem>
        {onDuplicate && (
          <DropdownMenuItem onClick={() => onDuplicate(task)}>
            <IconCopy />
            Duplicate
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem variant="destructive" onClick={() => onDelete(task)}>
            <IconTrash />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
