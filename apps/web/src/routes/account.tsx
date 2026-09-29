import { createFileRoute, Link } from "@tanstack/react-router";
import { SessionGate } from "@/lib/session";
import { Brand } from "@/components/ui/brand";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { SecuritySettingsPage } from "@/features/settings/security";

export const Route = createFileRoute("/account")({
  component: AccountPage,
});

function AccountPage() {
  return (
    <SessionGate>
      <div className="min-h-svh bg-background text-foreground">
        <header className="flex h-16 items-center justify-between gap-4 border-b border-border bg-card px-5 sm:px-8">
          <Brand />
          <div className="flex items-center gap-4">
            <ThemeSwitcher compact />
            <Link to="/workspaces" className="text-sm font-medium text-primary">
              Workspaces
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Your account</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage your profile and security, even without a workspace.
            </p>
          </div>
          <SecuritySettingsPage />
        </main>
      </div>
    </SessionGate>
  );
}
