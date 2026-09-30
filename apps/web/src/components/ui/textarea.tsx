import * as React from "react";

import { cn } from "@/lib/utils";

type TextareaAppearance = "default" | "composer";

const textareaAppearanceClasses: Record<TextareaAppearance, string> = {
  default: "",
  composer:
    "bg-transparent border-none shadow-none text-sm outline-none focus-visible:ring-0 px-3 pt-3 pb-1 placeholder:text-muted-foreground/50",
};

function Textarea({
  className,
  appearance = "default",
  ...props
}: React.ComponentProps<"textarea"> & { appearance?: TextareaAppearance }) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border-2 bg-transparent px-3 py-2 text-base transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        textareaAppearanceClasses[appearance],
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
