import { IconX, IconRefresh, IconLoader, IconCircleCheckFilled } from "@tabler/icons-react";

type Status = "pending" | "uploading" | "success" | "failed";

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
  status?: Status;
  retryUpload: () => void;
}

function getFileMeta(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return { label: "PDF", bg: "bg-red-500/90", text: "text-white" };
  if (ext === "doc" || ext === "docx") return { label: "DOC", bg: "bg-blue-500/90", text: "text-white" };
  if (ext === "xls" || ext === "xlsx") return { label: "XLS", bg: "bg-green-600/90", text: "text-white" };
  if (ext === "ppt" || ext === "pptx") return { label: "PPT", bg: "bg-orange-500/90", text: "text-white" };
  if (ext === "zip" || ext === "rar") return { label: "ZIP", bg: "bg-violet-500/90", text: "text-white" };
  if (ext === "mp3" || ext === "webm" || ext === "ogg") return { label: "AUD", bg: "bg-pink-500/90", text: "text-white" };
  return { label: "FILE", bg: "bg-muted-foreground/70", text: "text-white" };
}

function formatSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function FilePreview({ file, onRemove, status = "pending", retryUpload }: FilePreviewProps) {
  const meta = getFileMeta(file);

  return (
    <div className="relative flex items-center gap-2.5 bg-muted/60 border border-border/60 rounded-md px-3 py-2 w-56 group">

      {/* File type badge */}
      <div className={`w-9 h-9 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${meta.bg} ${meta.text}`}>
        {meta.label}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate leading-tight">{file.name}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{formatSize(file.size)}</p>
      </div>

      {/* Status indicator */}
      <div className="shrink-0">
        {status === "uploading" && <IconLoader className="w-3.5 h-3.5 text-primary-button animate-spin" />}
        {status === "success" && <IconCircleCheckFilled className="w-3.5 h-3.5 text-green-500" />}
        {status === "failed" && (
          <button onClick={retryUpload} title="Retry" className="text-destructive hover:text-destructive/80 transition-colors">
            <IconRefresh className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Remove — shows on hover */}
      <button
        onClick={onRemove}
        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-foreground/80 text-background rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-foreground"
        title="Remove"
      >
        <IconX className="w-2.5 h-2.5" />
      </button>

      {/* Uploading dim overlay */}
      {status === "uploading" && (
        <div className="absolute inset-0 bg-background/40 rounded-md" />
      )}
    </div>
  );
}