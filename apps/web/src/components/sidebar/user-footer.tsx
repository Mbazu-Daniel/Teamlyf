import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { IconChevronDown, IconLogout, IconSettings } from "@tabler/icons-react";
import { getSession, signOut } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { useResetSession } from "@/lib/session";
import { useOrganization } from "@/lib/organization";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Account = Readonly<{ name?: string | null; email?: string | null }>;

/** Same cache entry the SessionGate reads, so the footer never refetches. */
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

type UserFooterProps = Readonly<{ collapsed: boolean }>;

/** Current identity plus the account menu: Settings and Log out. */
export function UserFooter({ collapsed }: UserFooterProps) {
  const navigate = useNavigate();
  const resetSession = useResetSession();
  const { organization, reset: resetWorkspace } = useOrganization();
  const user = useCurrentUser();
  const name = accountName(user);

  async function logOut() {
    try {
      await signOut();
    } finally {
      // Clear the in-memory workspace only. The persisted workspace is user-scoped
      // and intentionally survives sign-out so the same user returns to it next time.
      resetSession();
      resetWorkspace();
      await navigate({ to: "/sign-in" });
    }
  }

  return (
    <div className="border-t border-border">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              title={collapsed ? name : undefined}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors duration-150 hover:bg-muted",
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
        <DropdownMenuContent align="start" side="top" className="min-w-48 w-(--anchor-width)">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{user?.email || name}</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuItem render={<Link to="/$organizationSlug/settings" params={{ organizationSlug: organization?.slug || organization?.id || "" }} />}>
            <IconSettings aria-hidden="true" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void logOut()}>
            <IconLogout aria-hidden="true" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
