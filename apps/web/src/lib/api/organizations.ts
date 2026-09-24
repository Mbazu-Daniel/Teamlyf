import { client, type Organization } from "./client";

const LIST_KEYS = ["organizations", "data", "records"] as const;

/** The list endpoint answers bare or wrapped under one of these envelope keys. */
function envelopeList(payload: Record<string, unknown>): unknown[] {
  for (const key of LIST_KEYS) {
    const value = payload[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

/** List every organization the signed-in user belongs to. */
export async function listOrganizations(): Promise<Organization[]> {
  const payload = await client.request<unknown>("/organization/list");
  if (Array.isArray(payload)) return payload as Organization[];
  if (typeof payload === "object" && payload) {
    return envelopeList(payload as Record<string, unknown>) as Organization[];
  }
  return [];
}

export function createOrganization(body: { name: string; slug: string; logo?: string | null }) {
  return client.request<Organization>("/organization", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
