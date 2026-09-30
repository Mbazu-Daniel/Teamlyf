export const STORAGE_SERVICE = Symbol("STORAGE_SERVICE");

const STORAGE_LOCATIONS = [
  "avatars",
  "chat",
  "documents",
  "projects",
  "recordings",
  "calls",
  "logs",
  "exports",
] as const;

export type StorageLocation = (typeof STORAGE_LOCATIONS)[number];

const SEGMENT = /^[a-z0-9][a-z0-9._-]{0,63}$/;

function assertSegment(value: string, label: string): string {
  if (!SEGMENT.test(value)) throw new Error(`Invalid storage ${label}: ${value}`);
  return value;
}

export function sanitizeFileName(fileName: string): string {
  const lastSlash = Math.max(fileName.lastIndexOf("/"), fileName.lastIndexOf("\\"));
  const base = (lastSlash >= 0 ? fileName.slice(lastSlash + 1) : fileName).trim();
  const lastDot = base.lastIndexOf(".");
  const stem = lastDot > 0 ? base.slice(0, lastDot) : base;

  const rawExtension = lastDot > 0 ? base.slice(lastDot + 1).trim() : "";
  const extension = /^[a-z0-9]{1,8}$/i.test(rawExtension) ? `.${rawExtension.toLowerCase()}` : "";
  const cleaned = stem
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 80);
  return `${cleaned || "file"}${extension}`;
}

export function buildObjectKey(input: {
  organizationId: string;
  location: StorageLocation;
  fileName: string;
  scope?: string | string[];

  key?: string;
}): string {
  const segments = [
    assertSegment(input.organizationId, "organizationId"),
    assertSegment(input.location, "location"),
  ];
  const scope =
    input.scope === undefined ? [] : Array.isArray(input.scope) ? input.scope : [input.scope];
  for (const part of scope) segments.push(assertSegment(part, "scope"));
  segments.push(input.key ? assertSegment(input.key, "key") : sanitizeFileName(input.fileName));
  return segments.join("/");
}

export type StorageUploadRequest = {
  key: string;
  contentType: string;
};

export type StorageUploadTarget = {
  uploadUrl: string;
  fileKey: string;
  expiresAt: Date;
};

/**
 * A stored reference is either the full object key or only the leaf, with the
 * prefix rebuilt on read.
 *
 * `full` is what attachments use: the column carries `orgId/location/scope/file`
 * so a row is self-describing and `confirmUpload` can verify the prefix without
 * extra context. `leaf` is what single-asset columns such as a member avatar
 * use: only the file name is stored and the prefix is rebuilt from the owning
 * entity, so nothing has to be rewritten if the workspace moves.
 */
export type StorageKeyMode = "full" | "leaf";

/** Strips the leading prefix a leaf-mode column does not store. */
export function stripKeyPrefix(key: string, prefix: string): string {
  const trimmed = key.replace(/^\/+|\/+$/g, "");
  const cleanPrefix = prefix.replace(/^\/+|\/+$/g, "");
  if (trimmed === cleanPrefix) return "";
  const withSlash = `${cleanPrefix}/`;
  return trimmed.toLowerCase().startsWith(withSlash.toLowerCase())
    ? trimmed.slice(withSlash.length)
    : trimmed;
}

/** Rebuilds the full object key from the prefix plus a stored value. */
export function resolveObjectKey(input: {
  key: string;
  mode?: StorageKeyMode;
  organizationId: string;
  location: StorageLocation;
  scope?: string | string[];
}): string {
  const scope =
    input.scope === undefined ? [] : Array.isArray(input.scope) ? input.scope : [input.scope];
  const prefix = [input.organizationId, input.location, ...scope].map((part) =>
    assertSegment(part, "prefix"),
  );

  if (input.mode !== "leaf") {
    // The column already holds the full key. Re-validating it through
    // buildObjectKey would reject the path separators it legitimately contains.
    if (!input.key) throw new Error("Stored key is empty");
    return input.key;
  }

  const leaf = stripKeyPrefix(input.key, prefix.join("/"));
  if (!leaf) {
    throw new Error(`Stored value for ${input.location} is empty`);
  }
  return [...prefix, ...leaf.split("/")].join("/");
}

export type StorageDownloadTarget = {
  url: string;
  expiresAt: Date;
};

export interface StorageService {
  createUploadUrl(request: StorageUploadRequest): Promise<StorageUploadTarget>;
  createDownloadUrl(key: string, fileName: string): Promise<StorageDownloadTarget>;

  publicUrl(key: string): string | null;
  objectExists(key: string): Promise<boolean>;
  objectSize(key: string): Promise<number>;
  deleteObject(key: string): Promise<void>;
}
