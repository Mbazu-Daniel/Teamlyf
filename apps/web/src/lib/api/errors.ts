export type ApiErrorCode =
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

export class ApiError extends Error {
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

export function toApiError(status: number, payload: ApiErrorPayload | string): ApiError {
  const message = typeof payload === "string" ? payload : payload.message;
  const code = typeof payload === "string" ? undefined : payload.code;
  return new ApiError(
    message || defaultMessage(status),
    status,
    normalizeCode(code, status),
    typeof payload === "string" ? undefined : payload.details,
  );
}

function normalizeCode(code: string | undefined, status: number): ApiErrorCode {
  if (
    code === "UNAUTHORIZED" ||
    code === "FORBIDDEN" ||
    code === "NOT_FOUND" ||
    code === "VALIDATION_ERROR" ||
    code === "CONFLICT" ||
    code === "RATE_LIMITED" ||
    code === "BILLING_REQUIRED" ||
    code === "INTERNAL_ERROR"
  ) return code;
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "INTERNAL_ERROR";
  return "UNKNOWN";
}

function defaultMessage(status: number) {
  if (status === 401) return "Authentication is required";
  if (status === 403) return "You do not have permission to perform this action";
  if (status === 404) return "The requested resource was not found";
  if (status === 409) return "The request conflicts with existing data";
  if (status === 429) return "Too many requests";
  return status >= 500 ? "An internal server error occurred" : "Request failed with " + status;
}
