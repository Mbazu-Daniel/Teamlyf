import { NAV_HOME, NAV_ITEMS } from "@/components/sidebar/nav-items";

export type Crumb = Readonly<{ label: string; to: string }>;

/** Brand crumb: root of every trail, landing on the shell's home entry. */
const ROOT_CRUMB: Crumb = { label: "Teamlyf", to: NAV_HOME.to };

/** Known routes show their nav label; anything deeper keeps its path segment. */
const LABEL_BY_ROUTE = new Map<string, string>(NAV_ITEMS.map((item) => [item.to, item.label]));

/** Breadcrumbs derived from the path alone — no route data, no extra queries. */
export function getBreadcrumbs(pathname: string): readonly Crumb[] {
  const crumbs: Crumb[] = [ROOT_CRUMB];
  let path = "";
  for (const segment of pathname.split("/").filter(Boolean)) {
    path += `/${segment}`;
    crumbs.push({ label: LABEL_BY_ROUTE.get(path) ?? segment, to: path });
  }
  return crumbs;
}
