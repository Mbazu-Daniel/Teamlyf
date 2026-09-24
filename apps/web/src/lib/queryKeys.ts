/**
 * Query keys live in one module so cache invalidation never guesses a string.
 * The shape mirrors the API: an organization is the boundary for every resource.
 */
export const queryKeys = {
  session: ["session"] as const,
  organizations: ["organizations"] as const,
  members: (organizationId: string) => ["organizations", organizationId, "members"] as const,
  access: (organizationId: string) => ["organizations", organizationId, "access"] as const,
  billing: (organizationId: string) => ["organizations", organizationId, "billing"] as const,
  projects: (organizationId: string) => ["organizations", organizationId, "projects"] as const,
  project: (organizationId: string, projectId: string) =>
    ["organizations", organizationId, "projects", projectId] as const,
  statuses: (organizationId: string, projectId: string) =>
    ["organizations", organizationId, "projects", projectId, "statuses"] as const,
  tasks: (organizationId: string, projectId: string) =>
    ["organizations", organizationId, "projects", projectId, "tasks"] as const,
} as const;
