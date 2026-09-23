import { client } from "../api";

export type Document = {
  id: string;
  title: string;
  description?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type DocumentVersion = {
  id: string;
  version: number;
  content: string;
  createdAt?: string;
};

const path = (organizationId: string, suffix = "") =>
  "/organization/" + organizationId + "/documents" + suffix;

export const documentsApi = {
  list(organizationId: string) {
    return client.request<Document[]>(path(organizationId));
  },
  get(organizationId: string, documentId: string) {
    return client.request<Document>(path(organizationId, "/" + documentId));
  },
  versions(organizationId: string, documentId: string) {
    return client.request<DocumentVersion[]>(path(organizationId, "/" + documentId + "/versions"));
  },
};
