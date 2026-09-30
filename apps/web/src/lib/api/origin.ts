type PublicEnv = Record<string, string | undefined>;

function readPublicEnv(key: string): string | undefined {
  const meta = import.meta.env as unknown as PublicEnv;
  return meta[key]?.trim() || undefined;
}

export function normalizeOrigin(raw: string | undefined): string {
  const value = (raw || "").trim().replace(/\/+$/, "");
  if (!value) return "";
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) return value;
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("/")) return value;
  return `https://${value}`;
}

export const API_VERSION_PATH = "/api/v1";

/** Base origin for REST calls: the configured host, or blank for same-origin. */
export const API_ORIGIN = normalizeOrigin(readPublicEnv("VITE_API_URL"));

/** Every REST request goes here. Blank origin yields same-origin `/api/v1/...`. */
export const API_BASE_URL = `${API_ORIGIN}${API_VERSION_PATH}`;

/** Socket.IO origin. Falls back to the REST origin so one host serves both. */
export const WS_ORIGIN = normalizeOrigin(readPublicEnv("VITE_WS_URL")) || API_ORIGIN;

/** Browser-facing LiveKit URL, empty when calls are not configured. */
export const LIVEKIT_ORIGIN = normalizeOrigin(readPublicEnv("VITE_LIVEKIT_URL"));
