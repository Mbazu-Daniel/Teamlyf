import type { ReactNode } from "react";
import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import styles from "../styles.css?url";
import { OrganizationProvider } from "../lib/organization";

export const Route = createRootRoute({
  head: () => ({ meta: [{ charSet: "utf-8" }, { name: "viewport", content: "width=device-width, initial-scale=1" }, { title: "Teamlyf" }], links: [{ rel: "stylesheet", href: styles }] }),
  component: RootComponent,
});
function RootComponent() { return <RootDocument><OrganizationProvider><Outlet /></OrganizationProvider></RootDocument>; }
function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="en"><head><HeadContent /></head><body>{children}<Scripts /></body></html>;
}
