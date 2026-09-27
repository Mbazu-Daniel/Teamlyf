import { useEffect, useMemo } from "react";
import { IconX, IconRefresh, IconLoader, IconCircleCheckFilled } from "@tabler/icons-react";

interface ImagePreviewProps {
  file: File;
  status?: "pending" | "uploading" | "success" | "failed";
  onRemove: () => void;
  onRetry?: () => void;
}

export function ImagePreview({ file, status = "pending", onRemove, onRetry }: ImagePreviewProps) {
  const objectUrl = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  return (
    <div className="relative w-[72px] h-[72px] rounded-md overflow-hidden bg-muted border border-border/60 group shrink-0">
      {objectUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- local blob preview
        <img src={objectUrl} alt={file.name} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span className="absolute inset-0 animate-pulse bg-muted" aria-hidden="true" />
      )}

      {status === "uploading" && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <IconLoader className="w-4 h-4 text-white animate-spin" />
        </div>
      )}

      {status === "failed" && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <button
            type="button"
            onClick={onRetry}
            className="flex flex-col items-center gap-0.5 text-white"
            title="Retry upload"
          >
            <IconRefresh className="w-4 h-4" />
            <span className="text-[9px] font-semibold">Retry</span>
          </button>
        </div>
      )}

      {status === "success" && (
        <div className="absolute bottom-1 right-1">
          <IconCircleCheckFilled className="w-4 h-4 text-green-400 drop-shadow" />
        </div>
      )}

      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 w-4 h-4 bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black z-10"
        title="Remove"
      >
        <IconX className="w-2.5 h-2.5" />
      </button>
    </div>
  );
}
