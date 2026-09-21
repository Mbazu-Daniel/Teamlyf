import { useCallback, useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3101";

/** Origin of the API server, without any path suffix. */
export const apiOrigin = API_URL.replace(/\/+$/, "").replace(/\/api\/v1$/, "");

/** Base URL including the API version prefix. */
const apiBase = `${apiOrigin}/api/v1`;

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

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
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed with " + response.status);
  }
  return parseResponseBody<T>(response);
}

async function parseResponseBody<T>(response: Response): Promise<T> {
  if (response.status === 204) return null as T;
  const body = await response.text();
  return (body ? JSON.parse(body) : null) as T;
}

function resourcePath(organizationId: string, resource: string, suffix = "") {
  return "/organization/" + organizationId + "/" + resource + suffix;
}

function organizationClient(organizationId: string) {
  return {
    get: <T>(resource: string, suffix = "", options?: RequestOptions) =>
      request<T>(resourcePath(organizationId, resource, suffix), { ...options, method: "GET" }),
    post: <T>(resource: string, suffix = "", options: RequestOptions = {}) =>
      request<T>(resourcePath(organizationId, resource, suffix), { ...options, method: "POST" }),
    patch: <T>(resource: string, suffix = "", options: RequestOptions = {}) =>
      request<T>(resourcePath(organizationId, resource, suffix), { ...options, method: "PATCH" }),
  };
}

export type Organization = { id: string; name: string; slug?: string };

export const client = {
  request,
  organization: organizationClient,
};

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    credentials: "include",
    headers: { "content-type": "application/json", ...init?.headers },
    ...init,
  });
  if (!response.ok) {
    const body = await response.text();
    try {
      const parsed = JSON.parse(body) as { message?: string | string[] };
      const message = Array.isArray(parsed.message) ? parsed.message.join(", ") : parsed.message;
      throw new ApiError(response.status, message || body || "Request failed");
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(response.status, body || "Request failed");
    }
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export type ResourceState<T> = {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  reload: () => Promise<void>;
  setData: (value: T | null | ((current: T | null) => T | null)) => void;
};

/** A small dependency-free data hook for the product pages. */
export function useApiResource<T>(path: string | null): ResourceState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState<ApiError | null>(null);
  const reload = useCallback(async () => {
    if (!path) { setData(null); setLoading(false); return; }
    setLoading(true); setError(null);
    try { setData(await api<T>(path)); }
    catch (reason) { setError(reason instanceof ApiError ? reason : new ApiError(0, "Unable to reach Teamlyf")); }
    finally { setLoading(false); }
  }, [path]);
  useEffect(() => { void reload(); }, [reload]);
  return { data, loading, error, reload, setData };
}

export const organizationPath = (organizationId: string, suffix = "") =>
  `/organization/${encodeURIComponent(organizationId)}${suffix}`;

export async function signIn(email: string, password: string) { return api("/auth/sign-in/email", { method: "POST", body: JSON.stringify({ email, password }) }); }
export async function signUp(name: string, email: string, password: string) { return api("/auth/sign-up/email", { method: "POST", body: JSON.stringify({ name, email, password }) }); }