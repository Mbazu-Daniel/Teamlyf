import { cn } from "@/lib/utils";

/** Quiet one-liner shared by every loading and empty state in the feature. */
export function MutedMessage({ message, className }: { message: string; className?: string }) {
  return <p className={cn("text-sm text-muted-foreground", className)}>{message}</p>;
}

/** Failure banner shared by the list and detail pages. */
export function ErrorMessage({ message }: { message: string }) {
  return (
    <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
      {message}
    </p>
  );
}
