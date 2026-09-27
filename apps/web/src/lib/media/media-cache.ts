/**
 * Shared media byte cache for signed R2 URLs.
 *
 * - Key by stable path (see mediaCacheKey), not the full signed query string
 * - Memory Map of blob: object URLs + Cache Storage for persistence across remounts
 * - In-flight dedupe, ~50 min soft TTL (under 1h signed URL life), LRU eviction
 *
 * Pass `cacheKey` when you have a fileKey/avatarKey; otherwise URL pathname is used.
 */

import { isEphemeralMediaUrl, mediaCacheKey } from "./media-cache-key";

const CACHE_NAME = "teamlyf-media-v1";
const TTL_MS = 50 * 60 * 1000;
const MAX_ENTRIES = 80;

type MemoryEntry = {
  objectUrl: string;
  fetchedAt: number;
  /** Last successful fetch URL (may include signature). */
  sourceUrl: string;
};

const memory = new Map<string, MemoryEntry>();
const inflight = new Map<string, Promise<string>>();
const lruKeys: string[] = [];

function touchLru(key: string) {
  const idx = lruKeys.indexOf(key);
  if (idx >= 0) lruKeys.splice(idx, 1);
  lruKeys.push(key);
}

function evictIfNeeded() {
  while (lruKeys.length > MAX_ENTRIES) {
    const oldest = lruKeys.shift();
    if (!oldest) break;
    const entry = memory.get(oldest);
    if (entry) {
      URL.revokeObjectURL(entry.objectUrl);
      memory.delete(oldest);
    }
    if (typeof caches !== "undefined") {
      void caches.open(CACHE_NAME).then((cache) => cache.delete(oldest));
    }
  }
}

async function readFromCacheStorage(key: string): Promise<Response | null> {
  if (typeof caches === "undefined") return null;
  try {
    const cache = await caches.open(CACHE_NAME);
    return (await cache.match(key)) ?? null;
  } catch {
    return null;
  }
}

async function writeToCacheStorage(key: string, response: Response): Promise<void> {
  if (typeof caches === "undefined") return;
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(key, response);
  } catch {
    // Quota / private mode — memory cache still works.
  }
}

function storeMemory(key: string, blob: Blob, sourceUrl: string): string {
  const existing = memory.get(key);
  if (existing) {
    URL.revokeObjectURL(existing.objectUrl);
  }
  const objectUrl = URL.createObjectURL(blob);
  memory.set(key, { objectUrl, fetchedAt: Date.now(), sourceUrl });
  touchLru(key);
  evictIfNeeded();
  return objectUrl;
}

function isFresh(entry: MemoryEntry): boolean {
  return Date.now() - entry.fetchedAt < TTL_MS;
}

async function fetchAndStore(key: string, url: string): Promise<string> {
  const response = await fetch(url, { mode: "cors", credentials: "omit" });
  if (!response.ok) {
    throw new Error(`Media fetch failed (${response.status})`);
  }

  const cloneForCache = response.clone();
  const blob = await response.blob();
  void writeToCacheStorage(key, cloneForCache);
  return storeMemory(key, blob, url);
}

export type GetObjectUrlOptions = {
  cacheKey?: string | null;
  /** Force network fetch even if memory/Cache Storage has an entry. */
  force?: boolean;
};

/**
 * Returns a blob: object URL for display, reusing cached bytes when possible.
 * Falls back to the original `url` only if callers handle errors themselves —
 * this function throws on hard failure after cache miss.
 */
export async function getObjectUrl(
  url: string,
  options?: GetObjectUrlOptions,
): Promise<string> {
  if (isEphemeralMediaUrl(url)) return url;

  const key = mediaCacheKey(url, options?.cacheKey);
  if (!key) return url;

  if (!options?.force) {
    const hit = memory.get(key);
    if (hit && isFresh(hit)) {
      touchLru(key);
      return hit.objectUrl;
    }
  }

  const pending = inflight.get(key);
  if (pending) return pending;

  const work = (async () => {
    if (!options?.force) {
      const cachedResponse = await readFromCacheStorage(key);
      if (cachedResponse?.ok) {
        const blob = await cachedResponse.blob();
        return storeMemory(key, blob, url);
      }
    }

    try {
      return await fetchAndStore(key, url);
    } catch (firstError) {
      // Stale signed URL / CORS — try once more only if we had a different source.
      const stale = memory.get(key);
      if (stale && stale.sourceUrl !== url) {
        try {
          return await fetchAndStore(key, url);
        } catch {
          // fall through
        }
      }
      throw firstError;
    }
  })();

  inflight.set(key, work);
  try {
    return await work;
  } finally {
    inflight.delete(key);
  }
}
