/**
 * The storage seam. Callers hand out capability URLs and store objects; they
 * never learn which provider serves them, so a local relay today and an
 * S3-compatible bucket tomorrow are the same three calls.
 */
export const STORAGE_SERVICE = Symbol("STORAGE_SERVICE");

export type StorageUploadRequest = {
  key: string;
  contentType: string;
};

/** Handed to the client so it can PUT bytes straight at the provider. */
export type StorageUploadTarget = {
  uploadUrl: string;
  fileKey: string;
  expiresAt: Date;
};

/** Handed to the client so it can read the object back. */
export type StorageDownloadTarget = {
  url: string;
  expiresAt: Date;
};

/**
 * The bytes an upload URL was minted for. The provider reads the request body
 * itself so node-style request streams never leak into the API modules.
 */
export type StorageUploadStream = {
  chunks: AsyncIterable<Buffer | Uint8Array>;
  contentType?: string;
};

export type StoredObject = {
  body: Buffer;
  fileName: string;
};

export interface StorageService {
  createUploadUrl(request: StorageUploadRequest): Promise<StorageUploadTarget>;
  createDownloadUrl(key: string, fileName: string): Promise<StorageDownloadTarget>;
  /** Rejects an expired, tampered, or wrong-content-type upload. */
  acceptUpload(token: string, upload: StorageUploadStream): Promise<void>;
  readDownload(token: string): Promise<StoredObject>;
  objectExists(key: string): Promise<boolean>;
  deleteObject(key: string): Promise<void>;
}
