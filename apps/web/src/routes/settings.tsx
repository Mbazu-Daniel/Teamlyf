import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { IconBuilding, IconCreditCard, IconLock, IconUsers } from "@tabler/icons-react";

export const Route = createFileRoute("/settings")({ component: SettingsLayout });

const items = [
  { to: "/settings/organization", label: "Organization", icon: IconBuilding },
  { to: "/settings/access", label: "Access", icon: IconLock },
  { to: "/settings/billing", label: "Billing", icon: IconCreditCard },
];

function SettingsLayout() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <header>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">Teamlyf</Link>
          <h1 className="mt-3 text-3xl font-semibold">Settings</h1>
          <p className="mt-2 text-sm text-muted-foreground">Manage your organization, access and billing.</p>
        </header>
        <div className="mt-8 grid gap-8 md:grid-cols-[220px_1fr]">
          <nav className="space-y-1">
            {items.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeProps={{ className: "bg-muted font-medium" }}
                inactiveProps={{ className: "text-muted-foreground hover:bg-muted/60" }}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm"
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </nav>
          <section className="min-w-0">
            <Outlet />
          </section>
        </div>
      </div>
    </main>
  );
}
