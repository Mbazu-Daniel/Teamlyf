import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { IconChevronDown, IconLogout, IconSettings } from "@tabler/icons-react";
import { getSession, signOut } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { useResetSession } from "@/lib/session";
import { useOrganization } from "@/lib/organization";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Account = Readonly<{ name?: string | null; email?: string | null }>;

function useCurrentUser() {
  const { data } = useQuery({
    queryKey: queryKeys.session,
    queryFn: getSession,
    staleTime: 60_000,
    retry: false,
  });
  return data?.user ?? null;
}

function accountName(account: Account | null) {
  return account?.name?.trim() || account?.email?.trim() || "Account";
}

type UserFooterProps = Readonly<{ collapsed: boolean; compact?: boolean }>;

export function UserFooter({ collapsed, compact = false }: UserFooterProps) {
  const navigate = useNavigate();
  const resetSession = useResetSession();
  const { organization, reset: resetWorkspace } = useOrganization();
  const user = useCurrentUser();
  const name = accountName(user);
  async function logOut() {
    try {
      await signOut();
    } finally {
      resetSession();
      resetWorkspace();
      await navigate({ to: "/sign-in" });
    }
  }

  return (
    <div className={cn(!compact && "border-t border-border", compact && "shrink-0")}>
      <div className={cn("flex items-center gap-1", !compact && "p-2")}>
        <ThemeSwitcher compact />
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                title={collapsed ? name : undefined}
                className={cn(
                  "flex items-center gap-2.5 text-left transition-colors duration-150 hover:bg-muted",
                  compact ? "rounded-lg px-2 py-1.5" : "flex-1 rounded-lg px-3 py-2.5",
                  collapsed && "justify-center px-0",
                )}
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-500/15 text-xs font-bold text-primary-300">
                  {name.slice(0, 1).toUpperCase()}
                </span>
                {!collapsed && (
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{name}</span>
                    {user?.email && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    )}
                  </span>
                )}
                {!collapsed && (
                  <IconChevronDown
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                )}
              </button>
            }
          />
          <DropdownMenuContent align="end" side="bottom" className="min-w-52 w-(--anchor-width)">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{user?.email || name}</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuItem
              render={
                <Link
                  to="/$organizationSlug/settings"
                  params={{ organizationSlug: organization?.slug || organization?.id || "" }}
                />
              }
            >
              <IconSettings aria-hidden="true" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void logOut()}>
              <IconLogout aria-hidden="true" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
