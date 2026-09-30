import { useEffect, useState } from "react";
import { getObjectUrl } from "./media-cache";
import { isEphemeralMediaUrl } from "./media-cache-key";

export function useCachedMediaSrc(
  src?: string | null,
  cacheKey?: string | null,
): string | undefined {
  const [cached, setCached] = useState<{
    src: string;
    cacheKey: string | null | undefined;
    url: string;
  } | null>(null);

  useEffect(() => {
    if (!src || isEphemeralMediaUrl(src)) {
      return;
    }

    let cancelled = false;

    void getObjectUrl(src, { cacheKey })
      .then((objectUrl) => {
        if (!cancelled) setCached({ src, cacheKey, url: objectUrl });
      })
      .catch(() => {
        if (!cancelled) setCached({ src, cacheKey, url: src });
      });

    return () => {
      cancelled = true;
    };
  }, [src, cacheKey]);

  if (!src) return undefined;
  if (isEphemeralMediaUrl(src)) return src;
  if (cached?.src === src && cached.cacheKey === cacheKey) return cached.url;
  return undefined;
}
