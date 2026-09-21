import type { ReactNode } from "react";
import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import styles from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "teamlyf" },
    ],
    links: [{ rel: "stylesheet", href: styles }],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
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

function NotFoundComponent() {
  return (
    <main className="not-found-page">
      <a className="not-found-brand" href="/">
        Teamlyf
      </a>
      <p className="eyebrow">404 · Page not found</p>
      <h1>This workspace page isn’t available.</h1>
      <p className="not-found-copy">
        Check the workspace address, or return home to choose where you want to work.
      </p>
      <a className="not-found-action" href="/">
        Back to Teamlyf
      </a>
    </main>
  );
}
