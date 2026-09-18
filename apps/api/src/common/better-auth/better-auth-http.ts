import type { Request, Response } from "express";
import { isBetterAuthError, sanitizeBetterAuthError } from "./better-auth-errors";

export function toFetchHeaders(req: Request): Headers {
  const headers = new globalThis.Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value !== undefined) {
      headers.set(key, Array.isArray(value) ? value.join(", ") : String(value));
    }
  }
  return headers;
}

export function forwardSetCookies(res: Response, upstream: globalThis.Response): void {
  const cookies = upstream.headers.getSetCookie?.() ?? [];
  for (const cookie of cookies) {
    res.append("Set-Cookie", cookie);
  }
}

export async function readResponseBody(response: globalThis.Response): Promise<unknown> {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return text;
  }

  if (response.ok) return body;
  if (isBetterAuthError(body)) return sanitizeBetterAuthError(body);
  return body;
}