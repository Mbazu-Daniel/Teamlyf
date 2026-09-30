import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { API_ENV } from "../config/env.module";
import type { ApiEnv } from "../config/env";
import type {
  StorageDownloadTarget,
  StorageService,
  StorageUploadRequest,
  StorageUploadTarget,
} from "./storage.types";

function toOrigin(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return "";
  return /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
}

@Injectable()
export class R2StorageService implements StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly ttlSeconds: number;

  private readonly publicBase: string | null;

  constructor(@Inject(API_ENV) env: ApiEnv) {
    this.bucket = env.R2_BUCKET_NAME;
    this.ttlSeconds = env.STORAGE_URL_TTL_SECONDS;

    this.client = new S3Client({
      region: "auto",
      endpoint: env.R2_ENDPOINT ?? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });

    const custom = env.R2_CUSTOM_DOMAIN ? toOrigin(env.R2_CUSTOM_DOMAIN) : "";
    const publicId = env.R2_PUBLIC_ID?.trim();

    const r2Dev =
      publicId && /^https?:\/\//.test(publicId)
        ? toOrigin(publicId)
        : publicId
          ? toOrigin(`pub-${publicId.replace(/^pub-/, "")}.r2.dev`)
          : "";

    this.publicBase = custom || r2Dev || null;
  }

  get isPublic(): boolean {
    return this.publicBase !== null;
  }

  async createUploadUrl(request: StorageUploadRequest): Promise<StorageUploadTarget> {
    const expiresIn = this.ttlSeconds;
    return {
      uploadUrl: await getSignedUrl(
        this.client,
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: request.key,
          ContentType: request.contentType,
        }),
        { expiresIn },
      ),
      fileKey: request.key,
      expiresAt: this.expiry(),
    };
  }

  async createDownloadUrl(key: string, fileName: string): Promise<StorageDownloadTarget> {
    if (this.publicBase) {
      return { url: this.publicUrl(key)!, expiresAt: this.expiry() };
    }
    return {
      url: await getSignedUrl(
        this.client,
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
          ResponseContentDisposition: `attachment; filename="${encodeURIComponent(fileName)}"`,
        }),
        { expiresIn: this.ttlSeconds },
      ),
      expiresAt: this.expiry(),
    };
  }

  publicUrl(key: string): string | null {
    if (!this.publicBase) return null;
    // Encode per segment so the path separators survive but spaces, `#` and
    // `?` inside a file name cannot truncate or re-interpret the URL.
    const encoded = key
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");
    return `${this.publicBase}/${encoded}`;
  }

  async objectExists(key: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return true;
    } catch {
      return false;
    }
  }

  async objectSize(key: string): Promise<number> {
    try {
      const head = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      if (head.ContentLength === undefined) throw new NotFoundException("Stored file not found");
      return head.ContentLength;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new NotFoundException("Stored file not found");
    }
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  private expiry(): Date {
    return new Date(Date.now() + this.ttlSeconds * 1000);
  }
}
