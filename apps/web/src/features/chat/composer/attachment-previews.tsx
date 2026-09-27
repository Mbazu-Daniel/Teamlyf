import { FilePreview } from "../file-preview";
import { ImagePreview } from "../image-preview";
import type { ComposerAttachment } from "./types";

type AttachmentPreviewsProps = {
  attachments: ComposerAttachment[];
  onRemove: (index: number) => void;
  onRetry: (index: number) => void;
};

export function AttachmentPreviews({
  attachments,
  onRemove,
  onRetry,
}: AttachmentPreviewsProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="px-3 pb-2 flex flex-wrap gap-2">
      {attachments.map((att, index) => (
        <div key={index} className="relative">
          {att.file.type.startsWith("image/") ? (
            <ImagePreview
              file={att.file}
              status={att.status}
              onRemove={() => onRemove(index)}
              onRetry={() => onRetry(index)}
            />
          ) : (
            <FilePreview
              file={att.file}
              onRemove={() => onRemove(index)}
              status={att.status}
              retryUpload={() => onRetry(index)}
            />
          )}
        </div>
      ))}
    </div>
  );
}
