export type ApiErrorPayload = { message?: string | string[]; code?: string; details?: unknown };

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

export function toApiError(status: number, payload: ApiErrorPayload | string): ApiError {
  if (typeof payload === "string") return new ApiError(status, payload || "Request failed with status " + status);
  const message = Array.isArray(payload.message) ? payload.message.join(", ") : payload.message;
  return new ApiError(status, message ?? "Request failed with status " + status, payload.code, payload.details);
}
