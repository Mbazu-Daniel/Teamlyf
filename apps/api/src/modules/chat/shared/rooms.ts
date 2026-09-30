// fallow-ignore-file unused-file — read by the Nest gateway via reflection
export const CHAT_ROOMS = {
  organization: (organizationId: string) => `organization:${organizationId}`,
  member: (memberId: string) => `member:${memberId}`,
  channel: (channelId: string) => `channel:${channelId}`,
} as const;

export const CHAT_NAMESPACE_PATTERN = /^\/organization\/([^/]+)\/chat$/;

export function organizationFromNamespace(namespace: string): string | null {
  return CHAT_NAMESPACE_PATTERN.exec(namespace)?.[1] ?? null;
}
