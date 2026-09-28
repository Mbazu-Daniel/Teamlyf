import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputSize = "default" | "search";
type InputDecor = "default" | "flat" | "filled" | "auth" | "auth-password";

const inputSizeClasses: Record<InputSize, string> = {
  default: "",
  search: "pl-9 text-sm",
};

const inputDecorClasses: Record<InputDecor, string> = {
  default: "",
  flat: "bg-background shadow-none",
  filled: "border-slate-200 bg-slate-50/80 shadow-none",
  auth: "h-12 rounded-xl border-border bg-background px-4 text-[15px] shadow-sm shadow-black/[0.02] focus-visible:border-primary/60 focus-visible:bg-card",
  "auth-password":
    "h-12 rounded-xl border-border bg-background px-4 pr-12 text-[15px] shadow-sm shadow-black/[0.02] focus-visible:border-primary/60 focus-visible:bg-card",
};

function Input({
  className,
  type,
  size = "default",
  decor = "default",
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  size?: InputSize;
  decor?: InputDecor;
}) {
  return (
    <input
      data-slot="input"
      type={type}
      className={cn(
        "flex h-10 w-full min-w-0 rounded-full border border-input bg-transparent px-4 text-base placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        inputDecorClasses[decor],
        inputSizeClasses[size],
        className,
      )}
      {...props}
    />
  );
}

export { Input };
