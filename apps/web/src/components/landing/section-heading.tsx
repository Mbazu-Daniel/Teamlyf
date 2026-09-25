import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Small muted kicker that opens a section — the page's shared section voice. */
function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "text-sm font-bold tracking-[0.12em] text-muted-foreground uppercase",
        className,
      )}
    >
      {children}
    </p>
  );
}

type SectionHeadingProps = {
  eyebrow: string;
  title: ReactNode;
  body?: ReactNode;
  align?: "center" | "start";
  className?: string;
};

/**
 * Eyebrow -> heading -> lede. Every landing section opens the same way, so the
 * page reads as one document instead of a stack of unrelated blocks.
 */
export function SectionHeading({
  eyebrow,
  title,
  body,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-4 text-3xl sm:text-4xl">{title}</h2>
      {body ? <p className="mt-4 text-xl text-muted-foreground">{body}</p> : null}
    </div>
  );
}
