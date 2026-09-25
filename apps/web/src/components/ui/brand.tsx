import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

/**
 * The Teamlyf mark, served from this app's own public folder — the same file the
 * favicon points at, so the tab icon and the brand row can never drift apart.
 * The mark is two-tone (light dots over deep-violet bars), which is why it sits
 * on a brand-tinted tile instead of the flat page background.
 */
const MARK = "/brand/logo-icon.svg";

/** Brand row: mark in its tile, then the wordmark. The top bar, auth pages, sidebar, and workspace shell share it. */
export function Brand({
  className,
  collapsed = false,
}: {
  className?: string;
  collapsed?: boolean;
}) {
  return (
    <Link
      to="/"
      className={cn("inline-flex shrink-0 items-center gap-2 font-bold tracking-tight", className)}
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-primary-500/30 bg-primary-500/20">
        <img src={MARK} alt="" width={26} height={16} className="h-4 w-auto" />
      </span>
      {!collapsed && <span className="truncate">Teamlyf</span>}
    </Link>
  );
}
