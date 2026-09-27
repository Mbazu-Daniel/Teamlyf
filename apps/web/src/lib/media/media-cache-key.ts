/**
 * Media cache helpers.
 *
 * Prefer an explicit `cacheKey` / `fileKey` when the API gives one.
 * Otherwise we derive a stable key by stripping query/hash from the URL so
 * re-signed R2 URLs (new query every hour) still hit the same cache entry.
 */

export function mediaCacheKey(url: string, explicit?: string | null): string {
  const trimmed = explicit?.trim();
  if (trimmed) return trimmed;

  if (!url) return "";

  if (
    url.startsWith("blob:") ||
    url.startsWith("data:") ||
    url.startsWith("/")
  ) {
    return url;
  }

  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url.split("#")[0]?.split("?")[0] ?? url;
  }
}

export function isEphemeralMediaUrl(url: string): boolean {
  return (
    !url ||
    url.startsWith("blob:") ||
    url.startsWith("data:") ||
    url.startsWith("/") ||
    url === "default"
  );
}
