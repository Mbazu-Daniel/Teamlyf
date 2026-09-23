const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3101";

type RequestOptions = RequestInit & {
  query?: Record<string, string | number | undefined>;
};

function buildUrl(path: string, query?: RequestOptions["query"]) {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const suffix = params.toString();
  return suffix ? `${path}${path.includes("?") ? "&" : "?"}${suffix}` : path;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { query, ...init } = options;
  const response = await fetch(`${API_URL}${buildUrl(path, query)}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

function resourcePath(organizationId: string, resource: string, suffix = "") {
  return `/organization/${organizationId}/${resource}${suffix}`;
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
export type Member = { id: string; organizationId: string; role: string };

export const client = {
  request,
  organization: organizationClient,
  getOrganization: (organizationId: string) =>
    request<Organization>(`/organization/${organizationId}`),
};
