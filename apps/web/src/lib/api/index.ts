import { request, type Organization, type RequestOptions } from "./client";
import { ApiError, toApiError, type ApiErrorPayload } from "./errors";

export { request, ApiError, toApiError };
export type { Organization, RequestOptions, ApiErrorPayload };

export const client = { request };
