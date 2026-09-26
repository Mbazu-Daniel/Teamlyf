import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { IconBuilding, IconCreditCard, IconLock, IconShield, IconSettings } from "@tabler/icons-react";

export const Route = createFileRoute("/$organizationSlug/settings")({ component: SettingsLayout });

const items = [
  { to: "/$organizationSlug/settings/organization", label: "Organization", icon: IconBuilding },
  { to: "/$organizationSlug/settings/access", label: "Access", icon: IconLock },
  { to: "/$organizationSlug/settings/security", label: "Security", icon: IconShield },
  { to: "/$organizationSlug/settings/billing", label: "Billing", icon: IconCreditCard },
] as const;

function SettingsLayout() {
  const { organizationSlug } = Route.useParams();

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-[var(--app-page-background)]">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1280px] flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="shrink-0">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <IconSettings className="size-3.5" />
            Organization settings
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your organization, access, security and billing.</p>
        </header>

        <div className="mt-6 grid min-h-0 flex-1 gap-5 overflow-hidden lg:grid-cols-[220px_minmax(0,1fr)]">
          <nav className="overflow-y-auto rounded-[16px] border border-border/60 bg-white p-2 shadow-sm dark:bg-card">
            <div className="space-y-1">
              {items.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  params={{ organizationSlug }}
                  activeProps={{ className: "bg-primary/10 text-primary font-semibold" }}
                  inactiveProps={{ className: "text-muted-foreground hover:bg-muted/60 hover:text-foreground" }}
                  className="flex h-10 items-center gap-3 rounded-[12px] px-3 text-sm transition-colors"
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </Link>
              ))}
            </div>
          </nav>
          <main className="min-h-0 overflow-y-auto pr-1">
            <section className="rounded-[16px] border border-border/60 bg-white p-5 shadow-sm dark:bg-card sm:p-6">
              <Outlet />
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
