import { IconChevronDown, IconChevronUp, IconPlus } from "@tabler/icons-react";
import type { Icon } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function PersonIcon({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={cn("text-white/90", className)}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
    </svg>
  );
}

export function Section({
  title,
  count,
  isOpen,
  onToggle,
  onAdd,
  children,
}: {
  title: string;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-2 py-1.5">
        <button
          onClick={onToggle}
          className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
        >
          {isOpen ? <IconChevronDown className="w-3 h-3" /> : <IconChevronUp className="w-3 h-3" />}
          <span>{title}</span>
          {count > 0 && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">
              {count}
            </span>
          )}
        </button>
        <button
          onClick={onAdd}
          className="flex size-6 items-center justify-center rounded-[7px] text-primary transition-colors hover:bg-primary/10"
        >
          <IconPlus className="w-3.5 h-3.5" />
        </button>
      </div>
      {isOpen && children}
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="space-y-1 px-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2.5 py-1">
          <Skeleton variant="md" className="h-5 w-5 shrink-0" />
          <Skeleton variant="rounded" className="h-3 flex-1" />
        </div>
      ))}
    </div>
  );
}

export function QuickActionButton({
  label,
  icon: Icon,
  active,
  onClick,
  layout,
}: {
  label: string;
  icon: Icon;
  active: boolean;
  onClick: () => void;
  layout: "sidebar" | "top";
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        "flex h-control min-w-0 flex-col items-center justify-center gap-0.5 rounded-[8px] px-1 py-1 text-[11px] font-semibold leading-none transition-colors cursor-pointer",
        layout === "top"
          ? active
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
          : active
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-3.5 shrink-0" />
      {/* Three actions share a 248px rail, so "Mentions" only fits on its own
          line with the icon stacked above it. */}
      <span className="min-w-0 max-w-full truncate">{label}</span>
    </button>
  );
}

export function fmt(str: string = "") {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
