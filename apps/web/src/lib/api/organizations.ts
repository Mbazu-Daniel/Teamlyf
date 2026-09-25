import { client, type Organization } from "./client";

const COLLECTION_KEYS = ["organizations", "data", "records"] as const;

/** The collection endpoint answers bare or wrapped under one of these envelope keys. */
function unwrapCollection(payload: Record<string, unknown>): unknown[] {
  for (const key of COLLECTION_KEYS) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

/** Get every organization the signed-in user belongs to. */
export async function getOrganizations(): Promise<Organization[]> {
  const payload = await client.request<unknown>("/organization");
  if (Array.isArray(payload)) return payload as Organization[];
  if (typeof payload === "object" && payload) {
    return unwrapCollection(payload as Record<string, unknown>) as Organization[];
  }
  return [];
}

export function createOrganization(body: { name: string; slug: string; logo?: string | null }) {
  return client.request<Organization>("/organization", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
