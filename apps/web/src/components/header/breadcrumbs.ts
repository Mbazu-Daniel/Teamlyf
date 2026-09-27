export type Crumb = Readonly<{ label: string; to: string }>;

/** Projects the crumb builder needs to turn a slug into the name people actually use. */
type ProjectRef = Readonly<{ name: string; identifier?: string }>;

const LABELS: Record<string, string> = {
  projects: "Projects",
  settings: "Settings",
  organization: "Organization",
  access: "Access",
  security: "Security",
  billing: "Billing",
  tasks: "Tasks",
  notes: "Notes",
  schedule: "Schedule",
  hr: "HR",
  notifications: "Notifications",
};

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** `website-redesign` in the URL reads as `Website Redesign` in the trail. */
function projectLabel(segment: string, projects: readonly ProjectRef[]): string | null {
  const project = projects.find((item) => item.identifier === segment || slugify(item.name) === segment);
  return project?.name ?? null;
}

/** Build breadcrumbs from app route segments without exposing the workspace name. */
export function getBreadcrumbs(
  pathname: string,
  projects: readonly ProjectRef[] = [],
): readonly Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 1) return [];

  const organizationSlug = segments[0];
  const crumbs: Crumb[] = [];
  const rest = segments.slice(1);
  let path = "/" + organizationSlug;

  for (const [index, segment] of rest.entries()) {
    path += "/" + segment;
    const isProjectId = rest[index - 1] === "projects";
    const label = (isProjectId && projectLabel(segment, projects)) || LABELS[segment] || segment;
    crumbs.push({ label, to: path });
  }

  return crumbs;
}
