import { createHmac, timingSafeEqual } from "node:crypto";
import { BadRequestException } from "@nestjs/common";

export type StorageTokenMode = "upload" | "download";

export type StorageTokenPayload = {
  key: string;
  mode: StorageTokenMode;
  expiresAt: number;
  /** Bind uploads to the content type they were minted for. */
  contentType?: string;
  /** Shown as the download filename. */
  fileName?: string;
};

/**
 * Capability tokens: the signature is the authorization, exactly like a
 * presigned URL. Nothing else about the request is trusted.
 */
export function signStorageToken(
  payload: StorageTokenPayload,
  secret: string,
): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${signatureFor(body, secret)}`;
}

export function verifyStorageToken(
  token: string,
  secret: string,
): StorageTokenPayload {
  const [body, signature] = token.split(".");
  if (!body || !signature) throw new BadRequestException("Malformed storage token");

  const expected = signatureFor(body, secret);
  const provided = Buffer.from(signature);
  const size = Buffer.from(expected);
  if (provided.length !== size.length || !timingSafeEqual(provided, size)) {
    throw new BadRequestException("Invalid storage token");
  }

  let payload: StorageTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString()) as StorageTokenPayload;
  } catch {
    throw new BadRequestException("Invalid storage token");
  }

  if (payload.expiresAt <= Date.now()) throw new BadRequestException("Storage token has expired");
  return payload;
}

function signatureFor(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("base64url");
}
