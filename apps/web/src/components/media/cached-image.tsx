import * as React from "react";
import { cn } from "@/lib/utils";
import { useCachedMediaSrc } from "@/lib/media/use-cached-media-src";

export type CachedImageProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src"
> & {
  src?: string | null;
  /** Stable key (fileKey / avatarKey / storage path). Prefer when available. */
  cacheKey?: string | null;
};

/**
 * Drop-in img that loads remote media through the shared media cache.
 */
export function CachedImage({
  src,
  cacheKey,
  alt,
  className,
  ...props
}: CachedImageProps) {
  const resolved = useCachedMediaSrc(src, cacheKey);

  if (!src) return null;

  if (!resolved) {
    return (
      <span
        className={cn("inline-block animate-pulse bg-muted", className)}
        aria-hidden="true"
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- blob:/cached signed media
    <img
      src={resolved}
      alt={alt ?? ""}
      className={className}
      {...props}
    />
  );
}
