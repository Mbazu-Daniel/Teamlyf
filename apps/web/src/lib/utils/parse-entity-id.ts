/** Normalize persisted UUIDs and legacy public IDs used by chat routes. */
export type EntityId = string;

const PUBLIC_ID_RE = /^[a-z]{2,4}_[0-9a-z]{13}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizePublicId(value: string): string {
  return value.trim().toLowerCase();
}

function isValidPublicId(value: string): boolean {
  return PUBLIC_ID_RE.test(normalizePublicId(value));
}

export function parseEntityId(
  value: string | number | string[] | undefined | null,
): EntityId {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw == null || raw === "") {
    throw new Error("Missing entity id");
  }
  // Allow temporary optimistic ids (temp-…) and legacy numeric during transition
  if (typeof raw === "number") {
    if (!Number.isFinite(raw)) {
      throw new Error(`Invalid entity id: ${raw}`);
    }
    return String(raw);
  }
  const normalized = normalizePublicId(String(raw));
  if (normalized.startsWith("temp-")) {
    return normalized;
  }
  if (UUID_RE.test(normalized) || isValidPublicId(normalized) || /^\d+$/.test(normalized)) {
    return normalized;
  }
  // Pass through opaque route segments that look like publicIds with longer bodies
  if (/^[a-z]+_[0-9a-z]+$/i.test(normalized)) {
    return normalized;
  }
  throw new Error(`Invalid entity id: ${String(raw)}`);
}
