import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { IconChevronDown, IconLogout, IconSettings, IconUser } from "@tabler/icons-react";
import { getSession, signOut } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { useResetSession } from "@/lib/session";
import { useOrganization } from "@/lib/organization";
import { useGetCurrentUser } from "@/features/chat/data/queries/use-get-current-user-hook";
import { ThemeAppearance } from "@/components/theme-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
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

/** Initial-letter badge that swaps in the uploaded photo when one exists. */
function AccountBadge({
  name,
  image,
  className,
}: Readonly<{ name: string; image?: string | null; className?: string }>) {
  return (
    <span
      className={cn(
        "grid size-8 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-gradient-to-br from-primary to-primary-400 text-[10px] font-bold text-primary-foreground",
        className,
      )}
    >
      {image ? (
        <img src={image} alt="" className="size-full object-cover" />
      ) : (
        name.slice(0, 1).toUpperCase()
      )}
    </span>
  );
}

export function UserFooter({ collapsed, compact = false }: UserFooterProps) {
  const navigate = useNavigate();
  const resetSession = useResetSession();
  const { organization, reset: resetWorkspace } = useOrganization();
  const user = useCurrentUser();
  // The workspace photo lives on the membership, not on the global auth record.
  const me = useGetCurrentUser(organization?.id ?? null);
  const avatar = me.data?.avatar ?? null;
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
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                title={collapsed ? name : undefined}
                className={cn(
                  "flex items-center gap-2.5 text-left transition-colors duration-150 hover:bg-muted",
                  compact
                    ? "rounded-lg px-2 py-1.5"
                    : "flex-1 rounded-[10px] px-2.5 py-2.5 hover:bg-sidebar-accent",
                  collapsed && "justify-center px-0",
                )}
              >
                <AccountBadge name={name} image={avatar} className="shadow-sm" />
                {!collapsed && (
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold leading-tight">
                      {name}
                    </span>
                    {user?.email && (
                      <span className="block truncate text-[10px] leading-tight text-muted-foreground">
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
          <DropdownMenuContent align="end" side="bottom" className="w-60">
            {/* Identity sits in the menu header rather than as a separate label row,
                so the trigger and the menu read as the same person. */}
            <DropdownMenuGroup>
              <div className="flex items-center gap-2.5 px-2 py-1.5">
                <AccountBadge name={name} image={avatar} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold leading-tight">{name}</span>
                  {user?.email && (
                    <span className="block truncate text-[10px] leading-tight text-muted-foreground">
                      {user.email}
                    </span>
                  )}
                </span>
              </div>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              render={
                <Link
                  to="/$organizationSlug/settings/profile"
                  params={{ organizationSlug: organization?.slug || organization?.id || "" }}
                />
              }
            >
              <IconUser aria-hidden="true" />
              Profile
            </DropdownMenuItem>
            {organization && (
              <DropdownMenuItem
                render={
                  <Link
                    to="/$organizationSlug/settings"
                    params={{ organizationSlug: organization.slug || organization.id }}
                  />
                }
              >
                <IconSettings aria-hidden="true" />
                Workspace settings
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <ThemeAppearance />
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
