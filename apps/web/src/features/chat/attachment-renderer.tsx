
import { IconPlayerPlay, IconX } from "@tabler/icons-react";
import { useState } from "react";
import { CachedImage } from "@/components/media/cached-image";
import { mediaCacheKey } from "@/lib/media/media-cache-key";

interface Attachment {
  mimeType: string;
  fileSize: number;
  url: string;
  name?: string; // optional file name
}

interface AttachmentRendererProps {
  attachments: Attachment[];
}

function extensionFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    return path.split(".").pop()?.toLowerCase() ?? "";
  } catch {
    return url.split("?")[0]?.split(".").pop()?.toLowerCase() ?? "";
  }
}

export function AttachmentRenderer({ attachments }: AttachmentRendererProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const getFileMeta = (mimeType: string, url: string) => {
    const ext = extensionFromUrl(url) || mimeType?.split("/").pop()?.toLowerCase();

    if (!ext) return { label: "FILE", color: "bg-gray-500" };

    if (["pdf"].includes(ext)) return { label: "PDF", color: "bg-red-500" };
    if (["doc", "docx"].includes(ext))
      return { label: "DOC", color: "bg-blue-500" };
    if (["xls", "xlsx"].includes(ext))
      return { label: "XLS", color: "bg-green-500" };
    return { label: ext.toUpperCase(), color: "bg-gray-500" };
  };

  const formatSize = (bytes: number) => {
    return bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(0)} KB`
      : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const isImageAttachment = (att: Attachment) => {
    if (att.mimeType?.startsWith("image/")) return true;
    const ext = extensionFromUrl(att.url);
    return ["png", "jpg", "jpeg", "gif", "webp"].includes(ext);
  };

  const isAudioAttachment = (att: Attachment) => {
    if (att.mimeType?.startsWith("audio/")) return true;
    const ext = extensionFromUrl(att.url);
    return ["webm", "mp3", "wav", "ogg", "m4a"].includes(ext);
  };

  const isVideoAttachment = (att: Attachment) => {
    if (att.mimeType?.startsWith("video/")) return true;
    const ext = extensionFromUrl(att.url);
    return ["mp4", "webm", "ogg", "mov"].includes(ext);
  };

  return (
    <>
      <div className="mt-2 flex flex-col gap-2">
        {attachments.map((att, idx) => {
          const cacheKey = mediaCacheKey(att.url);

          if (isImageAttachment(att)) {
            return (
              <button
                type="button"
                key={idx}
                className="relative w-40 h-40 rounded-lg overflow-hidden shadow-sm cursor-pointer border-0 p-0 bg-transparent"
                onClick={() => setLightboxUrl(att.url)}
              >
                <CachedImage
                  src={att.url}
                  cacheKey={cacheKey}
                  alt={att.name || `Attachment ${idx + 1}`}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </button>
            );
          }

          if (isAudioAttachment(att)) {
            return (
              <div
                key={idx}
                className="flex items-center gap-3 bg-sidebar-accent/70 rounded-2xl px-3 py-2 w-72"
              >
                <audio
                  src={att.url}
                  controls
                  className="w-full h-8"
                />
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatSize(att.fileSize)}
                </div>
              </div>
            );
          }

          if (isVideoAttachment(att)) {
            return (
              <div
                key={idx}
                className="relative w-40 h-40 rounded-lg overflow-hidden shadow-sm cursor-pointer"
                onClick={() => setLightboxUrl(att.url)}
              >
                <video
                  src={att.url}
                  className="w-full h-full object-cover"
                  muted
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="bg-black/60 rounded-full p-2">
                    <IconPlayerPlay className="text-white w-5 h-5" />
                  </div>
                </div>
              </div>
            );
          }

          const meta = getFileMeta(att.mimeType, att.url);
          return (
            <a
              key={idx}
              href={att.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 bg-sidebar-accent/70 rounded-lg p-3 w-72 hover:bg-sidebar-accent transition-colors"
            >
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-lg text-white text-xs font-semibold ${meta.color}`}
              >
                {meta.label}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {att.name || `Attachment ${idx + 1}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatSize(att.fileSize)}
                </p>
              </div>
            </a>
          );
        })}
      </div>

      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white p-2 hover:text-gray-300"
            onClick={() => setLightboxUrl(null)}
          >
            <IconX size={24} />
          </button>

          {lightboxUrl.match(/\.(mp4|webm|ogg|mov)(\?|$)/i) ? (
            <video
              src={lightboxUrl}
              controls
              autoPlay
              className="rounded-md max-h-[90vh] object-contain"
            />
          ) : (
            <CachedImage
              src={lightboxUrl}
              cacheKey={mediaCacheKey(lightboxUrl)}
              alt="Preview"
              className="rounded-md max-h-[90vh] max-w-[90vw] object-contain"
            />
          )}
        </div>
      )}
    </>
  );
}
