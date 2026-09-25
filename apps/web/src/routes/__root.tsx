import type { ReactNode } from "react";
import { useState } from "react";
import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import styles from "../styles.css?url";
import { OrganizationProvider } from "../lib/organization";
import { NotFound } from "../components/not-found";

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
      { rel: "icon", type: "image/svg+xml", href: "/brand/logo-icon.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Mirza:wght@400;700&display=swap",
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  // Per-request instance: a module-scope QueryClient would leak cache across SSR requests.
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

  return (
    <RootDocument>
      <QueryClientProvider client={queryClient}>
        <OrganizationProvider>
          <Outlet />
        </OrganizationProvider>
        <Toaster richColors position="top-right" theme="dark" closeButton />
      </QueryClientProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="dark">
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
