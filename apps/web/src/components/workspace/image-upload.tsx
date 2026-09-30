import { useRef, useState, type DragEvent } from "react";
import { IconPhoto, IconUpload, IconX } from "@tabler/icons-react";
import { pageSecondaryAction } from "./page-layout";
import { WorkflowError } from "./workflow";

async function thumbnail(file: File) {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    throw new Error("Choose a PNG, JPEG or WebP image.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Choose an image under 5 MB.");
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 256 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image processing is not supported in this browser.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const data = canvas.toDataURL("image/webp", 0.8);
    if (data.length > 65000)
      throw new Error("This image is too detailed. Please choose a smaller image.");
    return data;
  } finally {
    bitmap.close();
  }
}

export function ImageUpload({
  label,
  value,
  onChange,

  shape = "square",
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  shape?: "square" | "circle";
  hint?: string;
}) {
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function accept(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await thumbnail(file));
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }

  function onDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDragging(false);
    void accept(event.dataTransfer.files?.[0]);
  }

  return (
    <div className="space-y-3">
      <span className="text-sm font-medium">{label}</span>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          disabled={busy}
          aria-label={value ? `Replace ${label}` : `Choose ${label}`}
          className={`group relative grid size-20 shrink-0 place-items-center overflow-hidden border border-dashed transition-colors ${
            shape === "circle" ? "rounded-full" : "rounded-xl"
          } ${
            // The empty state is tinted; a chosen image owns the whole frame,
            // so a translucent fill would wash over it.
            value
              ? dragging
                ? "border-primary"
                : "border-border"
              : dragging
                ? "border-primary bg-primary/10"
                : "border-border bg-muted/40 hover:border-primary/60"
          } disabled:opacity-60`}
        >
          {value ? (
            <img src={value} alt={`${label} preview`} className="size-full object-cover" />
          ) : (
            <IconPhoto className="size-6 text-muted-foreground" aria-hidden="true" />
          )}
          {busy && (
            <span
              role="status"
              className="absolute inset-0 grid place-items-center bg-background/70 text-[10px] font-medium"
            >
              Working…
            </span>
          )}
        </button>

        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs text-muted-foreground">
            {hint ?? "Click the box or drop a PNG, JPEG or WebP here. Up to 5 MB."}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={pageSecondaryAction}
              onClick={() => inputRef.current?.click()}
              disabled={busy}
            >
              <IconUpload className="size-3.5" />
              {value ? "Replace" : "Choose image"}
            </button>
            {value && (
              <button type="button" className={pageSecondaryAction} onClick={() => onChange("")}>
                <IconX className="size-3.5" />
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Kept out of the button so the click handler above is the only opener. */}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];

          event.target.value = "";
          void accept(file);
        }}
      />

      <WorkflowError error={error} />
    </div>
  );
}
