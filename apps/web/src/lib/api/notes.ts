import { client } from "./client";

export type Note = {
  id: string;
  title: string;
  content: string;
  private: boolean;
  archived: boolean;
  revision: number;
  favorite?: boolean;
  ownerId: string;
  parentId?: string | null;
  taskId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export const notesApi = {
  list: (organizationId: string) =>
    client.request<Note[]>(`/organization/${organizationId}/notes`, { query: { all: "true" } }),
  get: (org: string, id: string) => client.request<Note>(`/organization/${org}/notes/${id}`),
  search: (organizationId: string, q: string) =>
    client.request<Note[]>(`/organization/${organizationId}/notes/search`, { query: { q } }),
  create: (
    organizationId: string,
    input: Pick<Note, "title" | "content"> & Partial<Pick<Note, "parentId" | "taskId" | "private">>,
  ) =>
    client.request<Note>(`/organization/${organizationId}/notes`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (
    organizationId: string,
    noteId: string,
    input: Partial<
      Pick<Note, "title" | "content" | "parentId" | "taskId" | "private" | "archived" | "revision">
    >,
  ) =>
    client.request<Note>(`/organization/${organizationId}/notes/${noteId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  remove: (organizationId: string, noteId: string) =>
    client.request<void>(`/organization/${organizationId}/notes/${noteId}`, { method: "DELETE" }),
  duplicate: (org: string, id: string) =>
    client.request<Note>(`/organization/${org}/notes/${id}/duplicate`, { method: "POST" }),
  favorite: (org: string, id: string, enabled: boolean) =>
    client.request(`/organization/${org}/notes/${id}/favorite`, {
      method: "POST",
      body: JSON.stringify({ enabled }),
    }),
  snapshots: (org: string, id: string) =>
    client.request<
      { id: string; title: string; content: string; revision: number; createdAt: string }[]
    >(`/organization/${org}/notes/${id}/snapshots`),
  restore: (org: string, id: string, snapshot: string, revision: number) =>
    client.request<Note>(`/organization/${org}/notes/${id}/snapshots/${snapshot}/restore`, {
      method: "POST",
      body: JSON.stringify({ revision }),
    }),
  presence: (org: string, id: string) =>
    client.request<{ id: string; name: string }[]>(`/organization/${org}/notes/${id}/presence`, {
      method: "POST",
    }),
};
