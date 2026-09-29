import { createFileRoute, Link, Navigate, Outlet, useLocation } from "@tanstack/react-router";
import { IconBuilding, IconCreditCard, IconLock, IconShield } from "@tabler/icons-react";

export const Route = createFileRoute("/$organizationSlug/settings")({ component: SettingsLayout });

const items = [
  { to: "/$organizationSlug/settings/organization", label: "Organization", icon: IconBuilding },
  { to: "/$organizationSlug/settings/access", label: "Access", icon: IconLock },
  { to: "/$organizationSlug/settings/security", label: "Security", icon: IconShield },
  { to: "/$organizationSlug/settings/billing", label: "Billing", icon: IconCreditCard },
] as const;

function SettingsLayout() {
  const { organizationSlug } = Route.useParams();
  const { pathname } = useLocation();
  const current = items.find((item) => pathname.endsWith(item.to.split("/").at(-1)!)) ?? items[0];
  const descriptions = { Organization: "Workspace profile and the people who belong here.", Access: "Understand workspace roles and resource permissions.", Security: "Protect your account and manage signed-in devices.", Billing: "Manage your subscription and workspace capacity." };

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1440px] flex-col px-4 py-5 sm:px-6 lg:px-8">

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[18px] border border-border/70 bg-card lg:flex-row">
          <nav aria-label="Settings sections" className="shrink-0 overflow-auto border-b border-border/70 bg-gradient-to-b from-muted/40 to-card p-3 lg:w-[236px] lg:border-b-0 lg:border-r lg:p-4">
            <p className="mb-4 hidden px-3 pt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground lg:block">Workspace settings</p>
            <div className="flex gap-1 lg:flex-col">
              {items.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  params={{ organizationSlug }}
                  activeProps={{ className: "bg-primary text-primary-foreground font-medium" }}
                  inactiveProps={{ className: "text-muted-foreground hover:bg-muted/60 hover:text-foreground" }}
                  className="flex h-11 shrink-0 items-center gap-2.5 rounded-[10px] px-3 text-[13px] transition-colors"
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </Link>
              ))}
            </div>
          </nav>
          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
            <header className="sticky top-0 z-10 border-b border-border/70 bg-card/95 px-5 py-5 backdrop-blur-md sm:px-7"><h1 className="text-lg font-semibold tracking-tight">{current.label}</h1><p className="mt-1 text-sm text-muted-foreground">{descriptions[current.label]}</p></header>
            <div className="p-4 sm:p-6 lg:p-7">
              {pathname.replace(/\/$/, "").endsWith("/settings") ? <Navigate to="/$organizationSlug/settings/organization" params={{ organizationSlug }} replace /> : <Outlet />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
