import { useState } from "react";
import { pageInput, pageSecondaryAction } from "./page-layout";
import { WorkflowError } from "./workflow";

// Small profile images are normalized to a bounded raster thumbnail before saving.
// Keeping this with the profile avoids temporary signed URLs expiring in avatars.
async function thumbnail(file: File) {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error("Choose a PNG, JPEG or WebP image under 5 MB.");
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
    if (data.length > 65000) throw new Error("This image is too detailed. Please choose a smaller image.");
    return data;
  } finally { bitmap.close(); }
}

export function ImageUpload({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  return <div className="space-y-3">{value && <img src={value} alt={`${label} preview`} className="size-16 rounded-xl border object-contain" />}<label className="block space-y-2 text-sm"><span>{label}</span><input className={pageInput} type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={async (event) => { const file = event.target.files?.[0]; event.target.value = ""; if (!file) return; setBusy(true); setError(null); try { onChange(await thumbnail(file)); } catch (failure) { setError(failure); } finally { setBusy(false); } }} /></label><p className="text-xs text-muted-foreground">PNG, JPEG or WebP, up to 5 MB. Saved as a compact profile thumbnail when you save changes.</p>{busy && <p role="status" className="text-xs">Preparing image…</p>}{value && <button type="button" className={pageSecondaryAction} onClick={() => onChange("")}>Remove image</button>}<WorkflowError error={error} /></div>;
}
