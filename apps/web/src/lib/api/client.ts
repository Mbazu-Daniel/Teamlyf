const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3101";

export type RequestOptions = RequestInit & {
  query?: Record<string, string | number | undefined>;
};

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const entries = Object.entries(query ?? {}).filter(([, value]) => value !== undefined);
  const params = new URLSearchParams(entries.map(([key, value]) => [key, String(value)]));
  const suffix = params.toString();
  if (!suffix) return path;
  return path + (path.includes("?") ? "&" : "?") + suffix;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
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

export type Organization = { id: string; name: string; slug?: string };

export const client = { request };
