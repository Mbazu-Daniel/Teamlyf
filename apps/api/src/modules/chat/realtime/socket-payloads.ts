/** Socket payload shapes plus the small ack/validation helpers shared by the gateway and its handler modules. */

export type SendChannelMessagePayload = {
  channelId?: string;
  content?: string;
  attachmentIds?: string[];
  parentMessageId?: string;
};

export type SendDirectMessagePayload = {
  recipientId?: string;
  content?: string;
  attachmentIds?: string[];
  parentMessageId?: string;
};

export type TypingPayload = { channelId?: string; recipientId?: string };
export type ReactionPayload = { messageId?: string; messageType?: string; reaction?: string };
export type DeleteMessagePayload = { messageId?: string; messageType?: string };
export type JoinChannelPayload = { channelId?: string };

export type InitiateCallPayload = {
  callType?: string;
  recipientId?: string;
  channelId?: string;
  participantIds?: string[];
  /** Channel-call variant of `participantIds` the UI sends. */
  recipientIds?: string[];
};

export type CallIdPayload = { callId?: string; reason?: string };

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error";
}

export function validId(value: string | undefined): string | undefined {
  return typeof value === "string" && value ? value : undefined;
}

export function validIds(values: string[] | undefined): string[] | undefined {
  if (!Array.isArray(values)) return undefined;
  const cleaned = values.filter((value): value is string => typeof value === "string" && Boolean(value));
  return cleaned.length > 0 ? cleaned : undefined;
}
