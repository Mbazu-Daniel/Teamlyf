"use client";

import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { useCachedMediaSrc } from "@/lib/media/use-cached-media-src";

const roundedVariants = {
  full: "",
  md: "rounded-md",
  lg: "rounded-lg",
  "2xl": "rounded-2xl",
  "2.2rem": "rounded-[2.2rem]",
};

const avatarVariants = cva("relative flex size-8 shrink-0 overflow-hidden rounded-full", {
  variants: {
    rounded: roundedVariants,
    border: {
      none: "",
      subtle: "border border-border/50",
      background: "border-2 border-background",
      "background-lg": "border-4 border-background",
      strong: "border-2 border-border/60",
    },
    ring: {
      none: "",
      hairline: "ring-1 ring-border/20",
    },
    elevation: {
      none: "",
      sm: "shadow-sm",
      lg: "shadow-lg",
      "2xl": "shadow-2xl",
      inner: "shadow-inner",
    },
  },
  defaultVariants: {
    rounded: "full",
    border: "none",
    ring: "none",
    elevation: "none",
  },
});

const avatarFallbackVariants = cva(
  "bg-muted flex size-full items-center justify-center rounded-full",
  {
    variants: {
      rounded: roundedVariants,
      size: {
        default: "",
        "7px": "text-[7px]",
        "8px": "text-[8px]",
        "9px": "text-[9px]",
        "10px": "text-[10px]",
        xs: "text-xs",
        xl: "text-xl",
        "2xl": "text-2xl",
        "5xl": "text-5xl",
      },
      weight: {
        default: "",
        semibold: "font-semibold",
        bold: "font-bold",
        black: "font-black",
      },
      tone: {
        default: "",
        white: "text-white",
        primary: "text-primary",
      },
      bg: {
        default: "",
        "primary-5": "bg-primary/5",
        "blue-100": "bg-blue-100",
        "primary-button": "bg-primary-button",
        "blue-indigo-gradient": "bg-gradient-to-br from-blue-500 to-indigo-600",
      },
    },
    defaultVariants: {
      rounded: "full",
      size: "default",
      weight: "default",
      tone: "default",
      bg: "default",
    },
  },
);

function Avatar({
  className,
  rounded = "full",
  border = "none",
  ring = "none",
  elevation = "none",
  ...props
}: AvatarPrimitive.Root.Props & VariantProps<typeof avatarVariants>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(avatarVariants({ rounded, border, ring, elevation }), className)}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  src,
  cacheKey,
  ...props
}: AvatarPrimitive.Image.Props & {
  cacheKey?: string | null;
}) {
  const remoteSrc =
    typeof src === "string" && src !== "default" && src.trim() !== "" ? src : undefined;
  const resolved = useCachedMediaSrc(remoteSrc, cacheKey);

  if (!remoteSrc || !resolved) {
    return null;
  }

  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      src={resolved}
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  rounded = "full",
  size = "default",
  weight = "default",
  tone = "default",
  bg = "default",
  ...props
}: AvatarPrimitive.Fallback.Props & VariantProps<typeof avatarFallbackVariants>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(avatarFallbackVariants({ rounded, size, weight, tone, bg }), className)}
      {...props}
    />
  );
}

export type AvatarBorder = VariantProps<typeof avatarVariants>["border"];

export type AvatarFallbackSize = VariantProps<typeof avatarFallbackVariants>["size"];

export { Avatar, AvatarImage, AvatarFallback };
