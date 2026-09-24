import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      data-slot="input"
      type={type}
      className={cn(
        "flex h-10 w-full min-w-0 rounded-full border border-input bg-transparent px-4 text-base placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
