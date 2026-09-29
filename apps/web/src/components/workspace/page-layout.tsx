import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageIcon = ComponentType<{ className?: string }>;

/** Workspace surfaces mirror the client reference without affecting Overview. */
export function WorkspacePage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className="h-full min-h-0 overflow-y-auto"><div className={cn("mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-5 pb-8 sm:px-6 lg:px-8", className)}>{children}</div></div>;
}

export function PageHeader({ title, description, eyebrow, actions }: { title: string; description?: ReactNode; eyebrow?: string; actions?: ReactNode }) {
  return <header className="flex flex-wrap items-center justify-between gap-4 px-1">
    <div className="min-w-0">
      {eyebrow && <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>}
      <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">{title}</h1>
      {description && <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
  </header>;
}

export function PagePanel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-[16px] border border-border/70 bg-card p-4 shadow-[0_8px_20px_-20px_rgba(15,23,42,0.2)] sm:p-5", className)}>{children}</section>;
}

export function PageEmptyState({ icon: Icon, title, description, action, className }: { icon: PageIcon; title: string; description: string; action?: ReactNode; className?: string }) {
  return <div className={cn("flex min-h-[360px] flex-col items-center justify-center rounded-[16px] border border-dashed border-border/80 bg-gradient-to-b from-card to-primary/[0.025] px-6 py-12 text-center", className)}>
    <div className="mb-6 grid size-16 place-items-center rounded-[20px] bg-gradient-to-br from-primary/10 to-primary/20 text-primary"><Icon className="size-7" /></div>
    <h2 className="text-xl font-semibold tracking-[-0.025em]">{title}</h2>
    <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
    {action && <div className="mt-6">{action}</div>}
  </div>;
}

export function SettingsSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return <section className="overflow-hidden rounded-[16px] border border-border/70 bg-card">
    <div className="border-b border-border/70 bg-gradient-to-b from-muted/40 to-card px-5 py-5 sm:px-6">
      <h2 className="text-sm font-semibold">{title}</h2>
      {description && <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>}
    </div>
    <div className="p-5 sm:p-6">{children}</div>
  </section>;
}

export const pageInput = "h-control w-full rounded-[12px] border border-border/80 bg-muted/35 px-4 text-sm font-normal outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/50 focus:bg-card focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60";
export const pagePrimaryAction = "inline-flex h-control shrink-0 items-center justify-center gap-2 rounded-[12px] bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
export const pageSecondaryAction = "inline-flex h-control items-center justify-center gap-2 rounded-[12px] border border-border/80 bg-card px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50";
