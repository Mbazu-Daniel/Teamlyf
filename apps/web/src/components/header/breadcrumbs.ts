export type Crumb = Readonly<{ label: string; to: string }>;

type ProjectRef = Readonly<{ name: string; identifier?: string }>;

const LABELS: Record<string, string> = {
  projects: "Projects",
  settings: "Settings",
  organization: "Organization",
  access: "Access",
  security: "Security",
  billing: "Billing",
  profile: "Profile",
  leave: "Leave",
  tasks: "Tasks",
  notes: "Notes",
  schedule: "Schedule",
  hr: "HR",
  notifications: "Notifications",
  chats: "Chat",
  threads: "Threads",
  mentions: "Mentions",
  calls: "Calls",
  people: "HR",
  members: "Members",
  documents: "Documents",
  agents: "Agents",
  appearance: "Appearance",
};

/** Members has its own route, so it is not one of the HR sections. */
const HR_SECTIONS: Record<string, string> = {
  departments: "Departments",
  leave: "Leave",
  "org-chart": "Org chart",
};

function hrSectionCrumb(organizationSlug: string, section: string | null): Crumb | null {
  if (!section) return null;
  const label = HR_SECTIONS[section];
  if (!label) return null;
  return { label, to: `/${organizationSlug}/people?section=${encodeURIComponent(section)}` };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function projectLabel(segment: string, projects: readonly ProjectRef[]): string | null {
  const project = projects.find(
    (item) => item.identifier === segment || slugify(item.name) === segment,
  );
  return project?.name ?? null;
}

export function getBreadcrumbs(
  pathname: string,
  projects: readonly ProjectRef[] = [],
  search: string = "",
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

  if (rest[0] === "people") {
    const section = new URLSearchParams(search).get("section");
    const crumb = hrSectionCrumb(organizationSlug, section);
    if (crumb) crumbs.push(crumb);
  }

  return crumbs;
}
