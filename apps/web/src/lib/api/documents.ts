import { client, resolveApiPath } from "./client";
export type DocumentFile = {
  id: string;
  title: string;
  mimeType: string;
  content?: string | null;
  ownerId: string | null;
  parentId: string | null;
  objectKey: string | null;
  fileSize: number;
  deletedAt: string | null;
  updatedAt: string;
};
export type FilePermission = {
  documentId: string;
  subjectId: string;
  subjectKind: "member";
  access: "read" | "write" | "admin";
};
const path = (org: string, id = "") => `/organization/${org}/documents${id ? `/${id}` : ""}`;
export const documentsApi = {
  async list(org: string) {
    const items: DocumentFile[] = [];
    for (let page = 1; ; page++) {
      const batch = await client.request<DocumentFile[]>(path(org), {
        query: { page, limit: 100 },
      });
      items.push(...batch);
      if (batch.length < 100) return items;
    }
  },
  get: (org: string, id: string) => client.request<DocumentFile>(path(org, id)),
  create: (
    org: string,
    body: { title: string; mimeType: string; parentId?: string; content?: string },
  ) => client.request<DocumentFile>(path(org), { method: "POST", body: JSON.stringify(body) }),
  update: (
    org: string,
    id: string,
    body: { title?: string; content?: string; parentId?: string | null },
  ) => client.request<DocumentFile>(path(org, id), { method: "PATCH", body: JSON.stringify(body) }),
  trash: (org: string, id: string) => client.request(`${path(org, id)}/trash`, { method: "POST" }),
  restore: (org: string, id: string) =>
    client.request(`${path(org, id)}/restore`, { method: "POST" }),
  purge: (org: string, id: string) => client.request(path(org, id), { method: "DELETE" }),
  download: (org: string, id: string) =>
    client.request<{ url: string }>(`${path(org, id)}/download`),
  permissions: (org: string, id: string) =>
    client.request<FilePermission[]>(`${path(org, id)}/permissions`),
  share: (org: string, id: string, subjectId: string, access: FilePermission["access"]) =>
    client.request(`${path(org, id)}/permissions`, {
      method: "POST",
      body: JSON.stringify({ subjectKind: "member", subjectId, access }),
    }),
  unshare: (org: string, id: string, member: string) =>
    client.request(`${path(org, id)}/permissions/member/${member}`, { method: "DELETE" }),
  versions: (org: string, id: string) =>
    client.request<
      { id: string; version: string; title: string; content: string | null; createdAt: string }[]
    >(`${path(org, id)}/versions`),
  restoreVersion: (org: string, id: string, version: string) =>
    client.request(`${path(org, id)}/versions/${version}/restore`, { method: "POST" }),
  async replaceFile(org: string, id: string, file: File) {
    const upload = await documentsApi.upload(org, file);
    return client.request<DocumentFile>(`${path(org, id)}/replace-file`, {
      method: "POST",
      body: JSON.stringify({ uploadedDocumentId: upload.id }),
    });
  },
  async upload(org: string, file: File, parentId?: string) {
    const mimeType = file.type || "application/octet-stream";
    const target = await client.request<{ id: string; uploadUrl: string }>(`${path(org)}/upload`, {
      method: "POST",
      body: JSON.stringify({ title: file.name, mimeType, fileSize: file.size, parentId }),
    });
    const uploaded = await fetch(resolveApiPath(target.uploadUrl), {
      method: "PUT",
      body: file,
      headers: { "Content-Type": mimeType },
    });
    if (!uploaded.ok) throw new Error("File upload failed. Check the file size and retry.");
    return client.request<DocumentFile>(`${path(org, target.id)}/confirm-upload`, {
      method: "POST",
    });
  },
};
