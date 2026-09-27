/**
 * Socket.IO room names for the chat namespace `/organization/:orgId/chat`.
 * Rooms are scoped to one namespace, so an org prefix is redundant but keeps
 * the names self-describing when they show up in adapter dumps.
 */
export const CHAT_ROOMS = {
  organization: (organizationId: string) => `organization:${organizationId}`,
  member: (memberId: string) => `member:${memberId}`,
  channel: (channelId: string) => `channel:${channelId}`,
} as const;

/** Namespace the web client connects to: `/organization/:organizationId/chat`. */
export const CHAT_NAMESPACE_PATTERN = /^\/organization\/([^/]+)\/chat$/;

export function organizationFromNamespace(namespace: string): string | null {
  return CHAT_NAMESPACE_PATTERN.exec(namespace)?.[1] ?? null;
}
