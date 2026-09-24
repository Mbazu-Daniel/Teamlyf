import { useState, type ReactNode } from "react";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { AppHeader } from "@/components/header/app-header";

/**
 * App chrome: sidebar + frosted top bar + scrolling main.
 * Mounted once by the `_app` layout route so it never remounts between pages.
 */
export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  const [collapsed, setCollapsed] = useState(false);
  const toggle = () => setCollapsed((value) => !value);

  return (
    <div className="flex h-svh w-full overflow-hidden bg-background text-foreground">
      <AppSidebar collapsed={collapsed} onToggle={toggle} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader onToggle={toggle} />
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
