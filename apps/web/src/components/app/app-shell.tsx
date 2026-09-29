import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { AppHeader } from "@/components/header/app-header";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * App chrome: sidebar + frosted top bar + scrolling main.
 * Mounted once by the `_app` layout route so it never remounts between pages.
 */
export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobile = useIsMobile();
  const { pathname } = useLocation();
  useEffect(() => { setMobileOpen(false); }, [pathname]);
  const toggle = () => mobile ? setMobileOpen((value) => !value) : setCollapsed((value) => !value);

  return (
    <div className="flex h-svh w-full overflow-hidden bg-background text-foreground" style={{ backgroundImage: "var(--app-page-background)" }}>
      <div className="hidden h-full md:flex">
        <AppSidebar collapsed={collapsed} onToggle={toggle} />
      </div>
      <Sheet open={mobile && mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" variant="sidebar" className="w-[248px]" showCloseButton={false}>
          <SheetTitle className="sr-only">Workspace navigation</SheetTitle>
          <AppSidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader onToggle={toggle} />
        <main className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
