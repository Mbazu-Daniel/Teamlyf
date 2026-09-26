import { client } from "./client";

type Note = {
  id: string;
  title: string;
  content: string;
  parentId?: string | null;
  taskId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export const notesApi = {
  list: (organizationId: string) => client.request<Note[]>(`/organization/${organizationId}/notes`),
  search: (organizationId: string, q: string) =>
    client.request<Note[]>(`/organization/${organizationId}/notes/search`, { query: { q } }),
  create: (organizationId: string, input: Pick<Note, "title" | "content">) =>
    client.request<Note>(`/organization/${organizationId}/notes`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (organizationId: string, noteId: string, input: Pick<Note, "title" | "content">) =>
    client.request<Note>(`/organization/${organizationId}/notes/${noteId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  remove: (organizationId: string, noteId: string) => client.request<void>(`/organization/${organizationId}/notes/${noteId}`, { method: "DELETE" }),
};