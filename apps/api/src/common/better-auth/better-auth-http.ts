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
  for (const cookie of upstream.headers.getSetCookie?.() ?? []) {
    res.append("Set-Cookie", cookie);
  }
}

function tryParse(text: string): unknown {
  try { return JSON.parse(text); } catch { return text; }
}

export async function readResponseBody(response: globalThis.Response): Promise<unknown> {
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? parseOrFallback(text, response.ok) : null;
}

function parseOrFallback(text: string, ok: boolean): unknown {
  const body = tryParse(text);
  if (ok) return body;
  return isBetterAuthError(body) ? sanitizeBetterAuthError(body) : body;
}
