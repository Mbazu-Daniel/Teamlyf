type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "BILLING_REQUIRED"
  | "INTERNAL_ERROR"
  | "UNKNOWN";

export type ApiErrorPayload = {
  code?: string;
  message?: string;
  details?: unknown;
};

class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details: unknown;

  constructor(message: string, status: number, code: ApiErrorCode = "UNKNOWN", details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

const KNOWN_CODES: ReadonlySet<string> = new Set([
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "VALIDATION_ERROR",
  "CONFLICT",
  "RATE_LIMITED",
  "BILLING_REQUIRED",
  "INTERNAL_ERROR",
]);

const STATUS_CODES: Readonly<Record<number, ApiErrorCode>> = {
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  429: "RATE_LIMITED",
};

const STATUS_MESSAGES: Readonly<Record<number, string>> = {
  401: "Authentication is required",
  403: "You do not have permission to perform this action",
  404: "The requested resource was not found",
  409: "The request conflicts with existing data",
  429: "Too many requests",
};

export function toApiError(status: number, payload: ApiErrorPayload | string): ApiError {
  const { message, code, details } = normalizePayload(payload);
  return new ApiError(message ?? defaultMessage(status), status, normalizeCode(code, status), details);
}

function normalizePayload(payload: ApiErrorPayload | string) {
  if (typeof payload === "string") return { message: payload, code: undefined, details: undefined };
  return { message: payload.message, code: payload.code, details: payload.details };
}

function normalizeCode(code: string | undefined, status: number): ApiErrorCode {
  if (code && KNOWN_CODES.has(code)) return code as ApiErrorCode;
  return statusCodeFallback(status);
}

function statusCodeFallback(status: number): ApiErrorCode {
  const mapped = STATUS_CODES[status];
  if (mapped) return mapped;
  if (status >= 500) return "INTERNAL_ERROR";
  return "UNKNOWN";
}

function defaultMessage(status: number) {
  return STATUS_MESSAGES[status] ?? (status >= 500 ? "An internal server error occurred" : `Request failed with ${status}`);
}
