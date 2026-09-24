export type ApiErrorPayload = {
  message?: string | string[];
  code?: string;
  details?: unknown;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function normalizePayload(payload: ApiErrorPayload | string) {
  if (typeof payload === "string") {
    return { message: payload, code: undefined, details: undefined };
  }

  return {
    message: Array.isArray(payload.message) ? payload.message.join(", ") : payload.message,
    code: payload.code,
    details: payload.details,
  };
}

function fallbackMessage(status: number) {
  return "Request failed with status " + status;
}

export function toApiError(status: number, payload: ApiErrorPayload | string): ApiError {
  const normalized = normalizePayload(payload);
  return new ApiError(
    status,
    normalized.message ?? fallbackMessage(status),
    normalized.code,
    normalized.details,
  );
}
