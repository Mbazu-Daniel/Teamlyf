const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3101";

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!response.ok) throw new Error((await response.text()) || `Request failed with ${response.status}`);
  return response.json() as Promise<T>;
}

export type Organization = { id: string; name: string; slug?: string };
export type Member = { id: string; organizationId: string; role: string };

export async function getOrganization(orgId: string) {
  return api<Organization>(`/organization/${orgId}`);
}
