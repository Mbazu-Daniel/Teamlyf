import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { API_ENV } from "../../common/config/env.module";
import type { ApiEnv } from "../../common/config/env";

@Injectable()
export class DocumentStorageService {
  private readonly client?: S3Client;
  constructor(@Inject(API_ENV) private readonly env: ApiEnv) {
    if (env.S3_BUCKET && env.S3_REGION && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY) {
      this.client = new S3Client({ region: env.S3_REGION, endpoint: env.S3_ENDPOINT, forcePathStyle: Boolean(env.S3_ENDPOINT), credentials: { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY } });
    }
  }
  async uploadUrl(key: string, mimeType: string) {
    this.requireClient();
    return getSignedUrl(this.client!, new PutObjectCommand({ Bucket: this.env.S3_BUCKET!, Key: key, ContentType: mimeType }), { expiresIn: 900 });
  }
  async downloadUrl(key: string) {
    this.requireClient();
    return getSignedUrl(this.client!, new GetObjectCommand({ Bucket: this.env.S3_BUCKET!, Key: key }), { expiresIn: 900 });
  }
  private requireClient() { if (!this.client) throw new BadRequestException("S3 storage is not configured"); }
}
