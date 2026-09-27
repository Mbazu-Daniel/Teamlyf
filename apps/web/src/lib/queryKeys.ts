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
  attachments: (organizationId: string, projectId: string, taskId: string) =>
    ["organizations", organizationId, "projects", projectId, "tasks", taskId, "attachments"] as const,
  relations: (organizationId: string, projectId: string, taskId: string) =>
    ["organizations", organizationId, "projects", projectId, "tasks", taskId, "relations"] as const,
  subscribers: (organizationId: string, projectId: string, taskId: string) =>
    ["organizations", organizationId, "projects", projectId, "tasks", taskId, "subscribers"] as const,
  /** Chat caches sit under one `chat` branch so a workspace switch can drop them together. */
  chat: {
    conversations: (organizationId: string) => ["chat", "conversations", organizationId] as const,
    channels: (organizationId: string) => ["chat", "channels", organizationId] as const,
    channelMembers: (organizationId: string, channelId: string) =>
      ["chat", "channelMembers", organizationId, channelId] as const,
    threads: (organizationId: string) => ["chat", "threads", organizationId] as const,
    mentions: (organizationId: string) => ["chat", "mentions", organizationId] as const,
    callHistory: (organizationId: string) => ["chat", "callHistory", organizationId] as const,
    missedCalls: (organizationId: string) => ["chat", "missed-calls", organizationId] as const,
    messageReactions: (organizationId: string, chatId: string, messageId: string) =>
      ["chat", "messageReactions", organizationId, chatId, messageId] as const,
    threadMessages: (type: string, chatId: string, parentMessageId: string) =>
      ["chat", "threadMessages", type, chatId, parentMessageId] as const,
    /** Exact key includes limit; omit limit for setQueriesData / invalidate prefix. */
    directMessages: (organizationId: string, chatId: string, limit?: number) =>
      limit !== undefined
        ? (["chat", "directMessages", organizationId, chatId, limit] as const)
        : (["chat", "directMessages", organizationId, chatId] as const),
    channelMessages: (organizationId: string, channelId: string, limit?: number) =>
      limit !== undefined
        ? (["chat", "channelMessages", organizationId, channelId, limit] as const)
        : (["chat", "channelMessages", organizationId, channelId] as const),
  },
  tenantMembers: {
    list: (organizationId: string) => ["tenant-members", organizationId] as const,
    detail: (organizationId: string, memberId: string) =>
      ["tenant-member", organizationId, memberId] as const,
  },
  user: {
    current: (organizationId: string) => ["currentUser", organizationId] as const,
  },
} as const;
