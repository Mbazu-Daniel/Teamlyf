import type { ReactNode } from "react";

export function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <header className="mb-7 flex flex-col gap-4 border-b border-border pb-6 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <p className="eyebrow mb-2">Workspace</p>
      <h1 className="text-[1.65rem] font-semibold tracking-[-0.03em] sm:text-[1.85rem]">{title}</h1>
      <p className="mt-2 max-w-2xl text-[0.8125rem] leading-6 text-muted-foreground">{description}</p>
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </header>;
}
