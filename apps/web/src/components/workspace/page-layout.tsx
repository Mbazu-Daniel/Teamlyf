import type { ComponentType, ReactNode } from "react";
import { IconSearch } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export type PageIcon = ComponentType<{ className?: string }>;

export function WorkspacePage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <div
        className={cn(
          "mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-5 pb-8 sm:px-6 lg:px-8",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  actions,
}: {
  eyebrow?: string;

  actions?: ReactNode;
}) {
  return (
    <header className="space-y-4">
      {eyebrow && (
        <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
          {eyebrow}
        </p>
      )}
      {actions ? (
        <section className="app-card rounded-[16px] border-border/70 p-4 shadow-[0_8px_20px_-20px_rgba(15,23,42,0.2)] sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">{actions}</div>
          </div>
        </section>
      ) : null}
    </header>
  );
}

export function PagePanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "rounded-[16px] border border-border/70 bg-card p-4 shadow-[0_8px_20px_-20px_rgba(15,23,42,0.2)] sm:p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function PageEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: PageIcon;
  title: string;

  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[360px] flex-col items-center justify-center rounded-[16px] border border-dashed border-border/80 bg-gradient-to-b from-card to-primary/[0.025] px-6 py-12 text-center",
        className,
      )}
    >
      <div className="mb-6 grid size-16 place-items-center rounded-[20px] bg-gradient-to-br from-primary/10 to-primary/20 text-primary">
        <Icon className="size-7" />
      </div>
      <h2 className="text-xl font-semibold tracking-[-0.025em]">{title}</h2>
      {description && (
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[16px] border border-border/70 bg-card">
      <div className="border-b border-border/70 bg-gradient-to-b from-muted/40 to-card px-5 py-5 sm:px-6">
        <h2 className="text-sm font-semibold">{title}</h2>
        {description && (
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

export const pageInput =
  "h-control w-full rounded-[12px] border border-border/80 bg-muted/35 px-4 text-sm font-normal outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary/50 focus:bg-card focus:ring-2 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60";
export const pagePrimaryAction =
  "inline-flex h-control shrink-0 items-center justify-center gap-2 rounded-[12px] bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
export const pageSecondaryAction =
  "inline-flex h-control items-center justify-center gap-2 rounded-[12px] border border-border/80 bg-card px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50";

export function PageToolbar({ children }: { children?: ReactNode }) {
  return <PageHeader actions={children} />;
}

export function ViewToggle<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: string; icon: ComponentType<{ className?: string }> }[];
  ariaLabel: string;
}) {
  return (
    <div
      className="flex h-control items-center rounded-[10px] bg-muted/75 p-1"
      role="group"
      aria-label={ariaLabel}
    >
      {options.map(({ value: option, label, icon: Icon }) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={value === option}
          className={cn(
            "inline-flex h-control-inner items-center gap-2 rounded-[8px] px-3.5 text-sm font-semibold transition-colors cursor-pointer",
            value === option
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="size-4" aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
}

export function ToolbarSearch({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
      <IconSearch
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-control w-full rounded-[10px] border border-border/80 bg-muted/45 pl-10 pr-3 text-sm font-normal outline-none transition placeholder:text-muted-foreground/80 focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/10"
      />
    </div>
  );
}
