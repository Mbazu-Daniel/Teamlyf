import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DashboardPanel({ title, description, action, children, className }: { title: string; description?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-[12px] border border-border/60 bg-white p-5 shadow-sm dark:bg-card sm:p-6", className)}>
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-border/60 pb-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-[-0.02em] text-foreground">{title}</h2>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
