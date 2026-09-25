import { toApiError, type ApiErrorPayload } from "./errors";

const API_VERSION_PATH = "/api/v1";
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "") ?? "";
const API_URL = configuredApiUrl.endsWith(API_VERSION_PATH)
  ? configuredApiUrl
  : `${configuredApiUrl}${API_VERSION_PATH}`;

type RequestOptions = RequestInit & {
  query?: Record<string, string | number | undefined>;
};

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const entries = Object.entries(query ?? {}).filter(([, value]) => value !== undefined);
  const params = new URLSearchParams(entries.map(([key, value]) => [key, String(value)]));
  const suffix = params.toString();
  if (!suffix) return path;
  return path + (path.includes("?") ? "&" : "?") + suffix;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { query, ...init } = options;
  const response = await fetch(API_URL + buildUrl(path, query), {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init.headers },
  });

  if (!response.ok) throw await parseApiError(response);
  return parseResponseBody<T>(response);
}

async function parseApiError(response: Response) {
  const body = await response.text();
  if (!body) return toApiError(response.status, "");
  try {
    return toApiError(response.status, JSON.parse(body) as ApiErrorPayload);
  } catch {
    return toApiError(response.status, body);
  }
}

async function parseResponseBody<T>(response: Response): Promise<T> {
  if (response.status === 204) return null as T;
  const body = await response.text();
  return (body ? JSON.parse(body) : null) as T;
}

export type Organization = { id: string; name: string; slug?: string };

export const client = { request };
