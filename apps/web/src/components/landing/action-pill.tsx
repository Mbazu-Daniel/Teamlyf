import type { ComponentProps, ReactNode } from "react";
import { IconArrowUpRight } from "@tabler/icons-react";
import { cva } from "class-variance-authority";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* Padding is asymmetric on purpose: the trailing circle sits flush inside the pill. */
const pill = cva("group/pill", {
  variants: {
    size: {
      sm: "pr-1 pl-4",
      default: "pr-1.5 pl-5",
      lg: "pr-1.5 pl-6",
    },
  },
  defaultVariants: { size: "lg" },
});

const badge = cva(
  "grid shrink-0 place-items-center rounded-full bg-primary-500 text-text-50 transition-colors duration-150 group-hover/pill:bg-primary-400",
  {
    variants: {
      size: {
        sm: "size-6",
        default: "size-7",
        lg: "size-9",
      },
    },
    defaultVariants: { size: "lg" },
  },
);

type ActionPillProps = Omit<ComponentProps<typeof Button>, "size"> & {
  size?: "sm" | "default" | "lg";
  /** Replaces the trailing arrow when the action needs its own glyph. */
  badge?: ReactNode;
};

/**
 * The landing page's one primary-action shape: an ink pill whose trailing end
 * holds a brand-violet circle. Every CTA on the page wears it, so the eye only
 * learns it once and the brand colour lands exactly on the click.
 */
export function ActionPill({
  children,
  badge: badgeContent,
  className,
  size = "lg",
  ...props
}: ActionPillProps) {
  return (
    <Button variant="ink" size={size} className={cn(pill({ size }), className)} {...props}>
      {children}
      <span aria-hidden="true" className={badge({ size })}>
        {badgeContent ?? <IconArrowUpRight className="size-4" />}
      </span>
    </Button>
  );
}
