export const ASSIGNEE_KINDS = ["member", "agent"] as const;

export type AssigneeKind = (typeof ASSIGNEE_KINDS)[number];
