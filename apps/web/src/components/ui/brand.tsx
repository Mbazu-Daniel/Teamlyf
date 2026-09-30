import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const MARK = "https://cdn.getteamlyf.com/teamlyf/logo-icon.svg";

export function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src={MARK}
      alt=""
      width={28}
      height={17}
      className={cn("h-[17px] w-auto shrink-0", className)}
    />
  );
}

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
      <BrandMark />
      {!collapsed && <span className="truncate">Teamlyf</span>}
    </Link>
  );
}
