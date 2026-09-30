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
  const cleaned = values.filter(
    (value): value is string => typeof value === "string" && Boolean(value),
  );
  return cleaned.length > 0 ? cleaned : undefined;
}

/**
 * Runtime bounds for inbound socket payloads. The TypeScript payload aliases
 * above are erased at runtime, so these reject oversized or malformed packets
 * before they reach a service, a database write, or a room broadcast.
 */
export const PAYLOAD_LIMITS = {
  maxContentLength: 8_000,
  maxIdLength: 64,
  maxIdListLength: 50,
  maxCallTypeLength: 32,
  maxReasonLength: 200,
  messageTypes: ["channel", "direct"] as const,
} as const;

export class InvalidPayloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPayloadError";
  }
}

function requireRecord(data: unknown): Record<string, unknown> {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new InvalidPayloadError("Malformed payload: expected an object");
  }
  return data;
}

/** Non-strings are rejected rather than coerced, so nothing untrusted reaches `eq()`. */
export function parseId(
  data: unknown,
  field: string,
  { required = false }: { required?: boolean } = {},
): string | undefined {
  const record = requireRecord(data);
  const value = record[field];
  if (value === undefined || value === null || value === "") {
    if (required) throw new InvalidPayloadError(`${field} is required`);
    return undefined;
  }
  if (typeof value !== "string") {
    throw new InvalidPayloadError(`${field} must be a string`);
  }
  if (value.length > PAYLOAD_LIMITS.maxIdLength) {
    throw new InvalidPayloadError(`${field} is too long`);
  }
  return value;
}

/** Oversized content is refused rather than truncated. */
export function parseText(
  data: unknown,
  field: string,
  {
    required = true,
    maxLength = PAYLOAD_LIMITS.maxContentLength,
  }: {
    required?: boolean;
    maxLength?: number;
  } = {},
): string | undefined {
  const record = requireRecord(data);
  const value = record[field];
  if (value === undefined || value === null || (typeof value === "string" && !value.trim())) {
    if (required) throw new InvalidPayloadError(`${field} is required`);
    return undefined;
  }
  if (typeof value !== "string") {
    throw new InvalidPayloadError(`${field} must be a string`);
  }
  if (value.length > maxLength) {
    throw new InvalidPayloadError(`${field} is too long (max ${maxLength} characters)`);
  }
  return value;
}

/** Rejected outright if the list itself is oversized, or if any entry is not a bounded id. */
export function parseIdList(data: unknown, field: string): string[] | undefined {
  const record = requireRecord(data);
  const value = record[field];
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) {
    throw new InvalidPayloadError(`${field} must be an array`);
  }
  if (value.length > PAYLOAD_LIMITS.maxIdListLength) {
    throw new InvalidPayloadError(
      `${field} has too many entries (max ${PAYLOAD_LIMITS.maxIdListLength})`,
    );
  }
  for (const entry of value) {
    if (typeof entry !== "string" || !entry) {
      throw new InvalidPayloadError(`${field} must contain non-empty strings`);
    }
    if (entry.length > PAYLOAD_LIMITS.maxIdLength) {
      throw new InvalidPayloadError(`${field} contains an id that is too long`);
    }
  }
  return value;
}

/** Keeps `messageType` a closed set, so a crafted value cannot widen a query. */
export function parseMessageType(data: unknown, field = "messageType"): string | undefined {
  const record = requireRecord(data);
  const value = record[field];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string" || !value) {
    throw new InvalidPayloadError(`${field} must be a string`);
  }
  if (!(PAYLOAD_LIMITS.messageTypes as readonly string[]).includes(value)) {
    throw new InvalidPayloadError(`${field} is not a supported message type`);
  }
  return value;
}

export type ValidSendChannelMessage = {
  channelId: string;
  content: string;
  attachmentIds?: string[];
  parentMessageId?: string;
};

export type ValidSendDirectMessage = {
  recipientId: string;
  content: string;
  attachmentIds?: string[];
  parentMessageId?: string;
};

export type ValidTyping = { channelId?: string; recipientId?: string };
export type ValidReaction = { messageId: string; messageType?: string; reaction?: string };
export type ValidDelete = { messageId: string; messageType?: string };
export type ValidJoinChannel = { channelId: string };

export type ValidInitiateCall = {
  callType?: string;
  recipientId?: string;
  channelId?: string;
  participantIds?: string[];
  recipientIds?: string[];
};

export type ValidCallId = { callId: string; reason?: string };

// Each parser returns only known, in-bounds fields, so handlers can trust their
// input and a hostile packet is refused before any service call.
export const parsePayloads = {
  joinChannel: (data: unknown): ValidJoinChannel => ({
    channelId: parseId(data, "channelId", { required: true }) as string,
  }),

  sendChannelMessage: (data: unknown): ValidSendChannelMessage => ({
    channelId: parseId(data, "channelId", { required: true }) as string,
    content: parseText(data, "content") as string,
    attachmentIds: parseIdList(data, "attachmentIds"),
    parentMessageId: parseId(data, "parentMessageId"),
  }),

  sendDirectMessage: (data: unknown): ValidSendDirectMessage => ({
    recipientId: parseId(data, "recipientId", { required: true }) as string,
    content: parseText(data, "content") as string,
    attachmentIds: parseIdList(data, "attachmentIds"),
    parentMessageId: parseId(data, "parentMessageId"),
  }),

  typing: (data: unknown): ValidTyping => ({
    channelId: parseId(data, "channelId"),
    recipientId: parseId(data, "recipientId"),
  }),

  reaction: (data: unknown): ValidReaction => ({
    messageId: parseId(data, "messageId", { required: true }) as string,
    messageType: parseMessageType(data),
    reaction: parseText(data, "reaction", {
      required: false,
      maxLength: PAYLOAD_LIMITS.maxCallTypeLength,
    }),
  }),

  deleteMessage: (data: unknown): ValidDelete => ({
    messageId: parseId(data, "messageId", { required: true }) as string,
    messageType: parseMessageType(data),
  }),

  initiateCall: (data: unknown): ValidInitiateCall => ({
    callType: parseText(data, "callType", {
      required: false,
      maxLength: PAYLOAD_LIMITS.maxCallTypeLength,
    }),
    recipientId: parseId(data, "recipientId"),
    channelId: parseId(data, "channelId"),
    participantIds: parseIdList(data, "participantIds"),
    recipientIds: parseIdList(data, "recipientIds"),
  }),

  callId: (data: unknown): ValidCallId => ({
    callId: parseId(data, "callId", { required: true }) as string,
    reason: parseText(data, "reason", {
      required: false,
      maxLength: PAYLOAD_LIMITS.maxReasonLength,
    }),
  }),
};
