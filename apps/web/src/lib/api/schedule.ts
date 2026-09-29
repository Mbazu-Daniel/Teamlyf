import { client } from "./client";
export type CalendarEvent = { id: string; title: string; description: string; location: string; startsAt: string; endsAt: string; color: string; creatorId: string | null };
type CalendarEventInput = Omit<CalendarEvent, "id" | "creatorId">;
const path = (org: string) => `/organization/${org}/events`;
export const scheduleApi = {
  list: (org: string, from: string, to: string) => client.request<CalendarEvent[]>(path(org), { query: { from, to } }),
  save: (org: string, input: CalendarEventInput, id?: string) => client.request<CalendarEvent>(`${path(org)}${id ? `/${id}` : ""}`, { method: id ? "PATCH" : "POST", body: JSON.stringify(input) }),
  delete: (org: string, id: string) => client.request(`${path(org)}/${id}`, { method: "DELETE" }),
};
