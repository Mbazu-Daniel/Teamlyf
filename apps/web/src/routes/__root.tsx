import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import styles from "../styles.css?url";
import themeStyles from "../theme.css?url";
import { OrganizationProvider } from "../lib/organization";
import { GlobalCallEventsBridge } from "../features/chat/data/global-call-events-bridge";
import { initializeTheme } from "../lib/theme";
import { NotFound } from "../components/not-found";

const FAVICON = "https://cdn.getteamlyf.com/teamlyf/logo-icon.svg";

export const Route = createRootRoute({
  notFoundComponent: NotFound,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#131318" },
      {
        name: "description",
        content:
          "Teamlyf is one workspace for project management, task tracking, team chat, video calls, docs and AI agents. Manage your team in one place without switching tools.",
      },
      { title: "Teamlyf: Project Management, Team Chat, Docs and AI Agents in One Workspace" },
    ],
    links: [
      { rel: "stylesheet", href: styles },
      { rel: "stylesheet", href: themeStyles },
      { rel: "icon", type: "image/svg+xml", href: FAVICON },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            gcTime: 1000 * 60 * 30,
            refetchOnWindowFocus: false,
            retry: 2,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
          },
        },
      }),
  );

  useEffect(() => initializeTheme(), []);

  return (
    <RootDocument>
      <QueryClientProvider client={queryClient}>
        <OrganizationProvider>
          <GlobalCallEventsBridge>
            <Outlet />
          </GlobalCallEventsBridge>
        </OrganizationProvider>
        <Toaster
          richColors
          position="top-right"
          theme="system"
          closeButton
          style={{ fontFamily: "var(--font-sans)" }}
        />
      </QueryClientProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
