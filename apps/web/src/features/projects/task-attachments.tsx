import { useRef } from "react";
import { IconDownload, IconPaperclip, IconTrash, IconUpload } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorMessage, MutedMessage } from "./feedback";
import { useTaskAttachments } from "./use-task-attachments";

type TaskAttachmentsProps = {
  organizationId: string;
  projectId: string;
  taskId: string;
};

/**
 * The attachments section of the task panel. Layout and copy mirror the
 * reference implementation; the buttons are this repo's design-system
 * primitives rather than hand-styled elements.
 */
export function TaskAttachments({ organizationId, projectId, taskId }: TaskAttachmentsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const files = useTaskAttachments(organizationId, projectId, taskId);

  return (
    <div className="mt-6 space-y-3 border-t border-border/60 pt-6">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
          <IconPaperclip className="h-4 w-4" /> Attachments
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={files.uploading}
        >
          <IconUpload className="mr-1.5 h-3.5 w-3.5" />
          Upload
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) files.uploadFile(file);
            event.target.value = "";
          }}
        />
      </div>

      {files.loading && <MutedMessage message="Loading…" />}
      {files.error && <ErrorMessage message={files.error} />}
      {!files.loading && !files.error && files.attachments.length === 0 && (
        <MutedMessage message="No attachments." />
      )}
      {files.deleteError && <ErrorMessage message={files.deleteError} />}

      <ul className="space-y-2">
        {files.attachments.map((file) => (
          <li
            key={file.id}
            className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2 text-sm"
          >
            <span className="truncate">{file.originalFileName}</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Download ${file.originalFileName}`}
                onClick={() => void files.downloadAttachment(file.id)}
              >
                <IconDownload className="h-3.5 w-3.5" />
              </Button>
              <ConfirmDialog
                trigger={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${file.originalFileName}`}
                  >
                    <IconTrash className="h-3.5 w-3.5" />
                  </Button>
                }
                title="Delete this attachment?"
                description="The file is removed for everyone on this task."
                confirmLabel="Delete attachment"
                destructive
                onConfirm={() => files.deleteAttachment(file.id)}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
