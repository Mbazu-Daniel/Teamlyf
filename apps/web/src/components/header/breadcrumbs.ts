export type Crumb = Readonly<{ label: string; to: string }>;

/** Build breadcrumbs from app route segments without exposing the workspace name. */
export function getBreadcrumbs(pathname: string): readonly Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 1) return [];

  const organizationSlug = segments[0];
  const labels: Record<string, string> = {
    projects: "Projects",
    settings: "Settings",
    organization: "Organization",
    access: "Access",
    security: "Security",
    billing: "Billing",
  };

  const crumbs: Crumb[] = [];
  let path = "/" + organizationSlug;

  for (const segment of segments.slice(1)) {
    path += "/" + segment;
    crumbs.push({ label: labels[segment] ?? segment, to: path });
  }

  return crumbs;
}
