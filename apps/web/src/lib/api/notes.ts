import { client } from "../api";

export type Note = {
  id: string;
  title: string;
  content: string;
  parentId: string | null;
  createdAt?: string;
  updatedAt?: string;
};

const path = (organizationId: string, suffix = "") =>
  "/organization/" + organizationId + "/notes" + suffix;

export const notesApi = {
  list(organizationId: string) {
    return client.request<Note[]>(path(organizationId));
  },
  get(organizationId: string, noteId: string) {
    return client.request<Note>(path(organizationId, "/" + noteId));
  },
};
