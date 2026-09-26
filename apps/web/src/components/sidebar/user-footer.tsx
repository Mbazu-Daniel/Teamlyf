import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { IconCheck, IconChevronDown, IconDeviceDesktop, IconLogout, IconMoon, IconSettings, IconSun } from "@tabler/icons-react";
import { getSession, signOut } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { useResetSession } from "@/lib/session";
import { useOrganization } from "@/lib/organization";
import { getThemeMode, setThemeMode, type ThemeMode } from "@/lib/theme";
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

const THEME_OPTIONS: readonly { mode: ThemeMode; label: string; icon: typeof IconSun }[] = [
  { mode: "light", label: "Light", icon: IconSun },
  { mode: "dark", label: "Dark", icon: IconMoon },
  { mode: "system", label: "System", icon: IconDeviceDesktop },
];

export function UserFooter({ collapsed, compact = false }: UserFooterProps) {
  const navigate = useNavigate();
  const resetSession = useResetSession();
  const { organization, reset: resetWorkspace } = useOrganization();
  const user = useCurrentUser();
  const name = accountName(user);
  const [theme, setTheme] = useState<ThemeMode>("system");

  useEffect(() => setTheme(getThemeMode()), []);

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
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              title={collapsed ? name : undefined}
              className={cn(
                "flex items-center gap-2.5 text-left transition-colors duration-150 hover:bg-muted",
                compact ? "rounded-lg px-2 py-1.5" : "w-full px-3 py-2.5",
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
                    <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                  )}
                </span>
              )}
              {!collapsed && <IconChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
            </button>
          }
        />
        <DropdownMenuContent align="end" side="bottom" className="min-w-52 w-(--anchor-width)">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{user?.email || name}</DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuItem render={<Link to="/$organizationSlug/settings" params={{ organizationSlug: organization?.slug || organization?.id || "" }} />}>
            <IconSettings aria-hidden="true" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Appearance</DropdownMenuLabel>
          {THEME_OPTIONS.map(({ mode, label, icon: Icon }) => (
            <DropdownMenuItem
              key={mode}
              onClick={() => {
                setThemeMode(mode);
                setTheme(mode);
              }}
            >
              <Icon aria-hidden="true" />
              {label}
              {theme === mode && <IconCheck className="ml-auto text-primary-300" aria-hidden="true" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => void logOut()}>
            <IconLogout aria-hidden="true" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
