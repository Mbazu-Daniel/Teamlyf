export type Crumb = Readonly<{ label: string; to: string }>;

/** Breadcrumbs keep the active organization slug in every app URL. */
export function getBreadcrumbs(pathname: string): readonly Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  if (!segments.length) return [];

  const organizationSlug = segments[0];
  const crumbs: Crumb[] = [{ label: "Teamlyf", to: `/${organizationSlug}` }];
  let path = `/${organizationSlug}`;

  for (const segment of segments.slice(1)) {
    path += `/${segment}`;
    const labels: Record<string, string> = {
      projects: "Projects",
      settings: "Settings",
      organization: "Organization",
      access: "Access",
      security: "Security",
      billing: "Billing",
    };
    crumbs.push({ label: labels[segment] ?? segment, to: path });
  }

  return crumbs;
}
