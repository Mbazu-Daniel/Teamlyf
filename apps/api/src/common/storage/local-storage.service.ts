import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
} from "@nestjs/common";
import { API_ENV } from "../config/env.module";
import type { ApiEnv } from "../config/env";
import { signStorageToken, verifyStorageToken, type StorageTokenMode, type StorageTokenPayload } from "./storage-token";
import type {
  StorageDownloadTarget,
  StorageService,
  StorageUploadRequest,
  StorageUploadStream,
  StorageUploadTarget,
  StoredObject,
} from "./storage.types";

/**
 * Filesystem-backed storage with the same contract as a presigned bucket: the
 * API mints a signed capability URL, the browser PUTs bytes at it, and reads
 * come back through a matching signed GET. Swapping in S3 means implementing
 * `StorageService` again — no caller changes.
 */
@Injectable()
export class LocalStorageService implements StorageService {
  private readonly root: string;
  private readonly secret: string;
  private readonly ttlSeconds: number;
  private readonly maxUploadBytes: number;

  constructor(@Inject(API_ENV) env: ApiEnv) {
    this.root = resolve(process.cwd(), env.STORAGE_LOCAL_DIR);
    // Signing inherits the app secret unless a dedicated key is configured.
    this.secret = env.STORAGE_SIGNING_SECRET ?? env.BETTER_AUTH_SECRET;
    this.ttlSeconds = env.STORAGE_URL_TTL_SECONDS;
    this.maxUploadBytes = env.STORAGE_MAX_UPLOAD_BYTES;
  }

  async createUploadUrl(request: StorageUploadRequest): Promise<StorageUploadTarget> {
    const expiresAt = this.expiry();
    return {
      // Relative to the API base URL so the browser keeps talking to the origin
      // it already uses, proxy or not.
      uploadUrl: this.capabilityUrl("upload", {
        key: request.key,
        mode: "upload",
        expiresAt: expiresAt.getTime(),
        contentType: request.contentType,
      }),
      fileKey: request.key,
      expiresAt,
    };
  }

  async createDownloadUrl(key: string, fileName: string): Promise<StorageDownloadTarget> {
    const expiresAt = this.expiry();
    return {
      url: this.capabilityUrl("download", {
        key,
        mode: "download",
        expiresAt: expiresAt.getTime(),
        fileName,
      }),
      expiresAt,
    };
  }

  async acceptUpload(token: string, upload: StorageUploadStream): Promise<void> {
    const payload = verifyStorageToken(token, this.secret);
    if (payload.mode !== "upload") throw new BadRequestException("Storage token is not for upload");

    const declared = upload.contentType?.split(";")[0].trim().toLowerCase();
    if (payload.contentType && declared !== payload.contentType.toLowerCase()) {
      throw new BadRequestException("Upload content type does not match the requested upload");
    }

    const target = this.resolvePath(payload.key);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, await this.readLimited(upload.chunks));
  }

  async readDownload(token: string): Promise<StoredObject> {
    const payload = verifyStorageToken(token, this.secret);
    if (payload.mode !== "download") throw new BadRequestException("Storage token is not for download");

    try {
      return {
        body: await readFile(this.resolvePath(payload.key)),
        fileName: payload.fileName ?? "download",
      };
    } catch {
      throw new NotFoundException("Stored file not found");
    }
  }

  async objectExists(key: string): Promise<boolean> {
    try {
      return (await stat(this.resolvePath(key))).isFile();
    } catch {
      return false;
    }
  }

  async deleteObject(key: string): Promise<void> {
    await rm(this.resolvePath(key), { force: true });
  }

  async objectSize(key: string): Promise<number> {
    try { return (await stat(this.resolvePath(key))).size; }
    catch { throw new NotFoundException("Stored file not found"); }
  }

  private capabilityUrl(mode: StorageTokenMode, payload: StorageTokenPayload): string {
    return `/storage/${mode}/${signStorageToken(payload, this.secret)}`;
  }

  private expiry(): Date {
    return new Date(Date.now() + this.ttlSeconds * 1000);
  }

  /** Keys are server-generated, but a stray `..` must never escape the root. */
  private resolvePath(key: string): string {
    const target = resolve(this.root, key);
    if (target !== this.root && !target.startsWith(this.root + sep)) {
      throw new BadRequestException("Invalid storage key");
    }
    return target;
  }

  private async readLimited(chunks: AsyncIterable<Buffer | Uint8Array>): Promise<Buffer> {
    const parts: Buffer[] = [];
    let received = 0;

    for await (const chunk of chunks) {
      received += chunk.byteLength;
      if (received > this.maxUploadBytes) {
        throw new PayloadTooLargeException("Upload exceeds the configured maximum size");
      }
      parts.push(Buffer.from(chunk));
    }

    if (received === 0) throw new BadRequestException("Upload body is empty");
    return Buffer.concat(parts);
  }
}
