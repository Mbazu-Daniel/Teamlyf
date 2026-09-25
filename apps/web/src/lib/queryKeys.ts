/**
 * Query keys live in one module so cache invalidation never guesses a string.
 * The shape mirrors the API: an organization is the boundary for every resource.
 */
export const queryKeys = {
  session: ["session"] as const,
  sessions: ["sessions"] as const,
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
  task: (organizationId: string, projectId: string, taskId: string) =>
    ["organizations", organizationId, "projects", projectId, "tasks", taskId] as const,
  labels: (organizationId: string, projectId: string) =>
    ["organizations", organizationId, "projects", projectId, "labels"] as const,
  milestones: (organizationId: string, projectId: string) =>
    ["organizations", organizationId, "projects", projectId, "milestones"] as const,
  comments: (organizationId: string, projectId: string, taskId: string) =>
    ["organizations", organizationId, "projects", projectId, "tasks", taskId, "comments"] as const,
  activity: (organizationId: string, projectId: string, taskId: string) =>
    ["organizations", organizationId, "projects", projectId, "tasks", taskId, "activity"] as const,
} as const;
