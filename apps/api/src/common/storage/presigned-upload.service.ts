import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { generateId } from "@teamlyf/db";
import { API_ENV } from "../config/env.module";
import type { ApiEnv } from "../config/env";
import {
  STORAGE_SERVICE,
  buildObjectKey,
  resolveObjectKey,
  stripKeyPrefix,
  type StorageKeyMode,
  type StorageLocation,
  type StorageService,
} from "./storage.types";

export type PresignedUpload = {
  uploadUrl: string;
  fileKey: string;

  headers: Record<string, string>;
  expiresAt: Date;
};

export type PresignedDownload = { url: string; expiresAt: Date };

@Injectable()
export class PresignedUploadService {
  constructor(
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
    @Inject(API_ENV) private readonly env: ApiEnv,
  ) {}

  async issueUploadUrl(input: {
    organizationId: string;
    location: StorageLocation;
    fileName: string;
    contentType: string;

    scope?: string | string[];

    unique?: boolean;

    /** `leaf` returns only the file name for the caller to store. */
    mode?: StorageKeyMode;
  }): Promise<PresignedUpload> {
    const fileName = input.unique === false ? input.fileName : `${generateId()}-${input.fileName}`;
    const key = buildObjectKey({
      organizationId: input.organizationId,
      location: input.location,
      fileName,
      scope: input.scope,
    });
    const target = await this.storage.createUploadUrl({ key, contentType: input.contentType });
    return {
      uploadUrl: target.uploadUrl,
      fileKey:
        input.mode === "leaf"
          ? stripKeyPrefix(target.fileKey, key.replace(/\/[^/]+$/, ""))
          : target.fileKey,
      headers: { "Content-Type": input.contentType },
      expiresAt: target.expiresAt,
    };
  }

  async issueDownloadUrl(key: string, fileName: string): Promise<PresignedDownload> {
    return this.storage.createDownloadUrl(key, fileName);
  }

  /** Turns a stored column value back into a URL, for either key mode. */
  async resolveUrl(input: {
    key: string | null | undefined;
    organizationId: string;
    location: StorageLocation;
    scope?: string | string[];
    mode?: StorageKeyMode;
    fileName?: string;
  }): Promise<{ url: string } | null> {
    if (!input.key) return null;
    const key = resolveObjectKey(input);
    const publicUrl = this.storage.publicUrl(key);
    if (publicUrl) return { url: publicUrl };
    const target = await this.storage.createDownloadUrl(key, input.fileName ?? key.split("/").pop()!);
    return { url: target.url };
  }

  async confirmUpload(input: {
    organizationId: string;
    location: StorageLocation;
    fileKey: string;

    scope?: string | string[];
  }): Promise<{ fileSize: number }> {
    const expectedPrefix = buildObjectKey({
      organizationId: input.organizationId,
      location: input.location,
      fileName: "probe",
      scope: input.scope,
    }).replace(/\/probe$/, "/");

    if (!input.fileKey.startsWith(expectedPrefix)) {
      throw new BadRequestException("Invalid file key");
    }
    if (!(await this.storage.objectExists(input.fileKey))) {
      throw new BadRequestException("Uploaded file not found in storage");
    }
    return { fileSize: await this.storage.objectSize(input.fileKey) };
  }

  async issueRecordingUrl(input: {
    organizationId: string;
    callId: string;
    fileName: string;
    contentType: string;
  }): Promise<PresignedUpload> {
    return this.issueUploadUrl({
      organizationId: input.organizationId,
      location: "recordings",
      fileName: input.fileName,
      contentType: input.contentType,
      scope: input.callId,
    });
  }

  get uploadTtlSeconds(): number {
    return this.env.STORAGE_URL_TTL_SECONDS;
  }
}
