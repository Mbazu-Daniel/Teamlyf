import { useCallback, useEffect, useState } from "react";

const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:3101/api/v1";
export const apiOrigin = apiBase.replace(/\/api\/v1\/?$/, "");

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

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
