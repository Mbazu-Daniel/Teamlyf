import { cn } from "@/lib/utils";

export function MutedMessage({ message, className }: { message: string; className?: string }) {
  return <p className={cn("text-sm text-muted-foreground", className)}>{message}</p>;
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
      {message}
    </p>
  );
}
