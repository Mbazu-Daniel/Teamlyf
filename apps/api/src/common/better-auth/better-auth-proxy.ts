import type { Request, Response as ExpressResponse } from "express";
import {
  forwardSetCookies,
  readResponseBody,
  toFetchHeaders,
} from "../../common/better-auth/better-auth-http";

export type BetterAuthResponder = (
  headers: Headers,
) => Promise<globalThis.Response>;

export async function proxyBetterAuth(
  req: Request,
  res: ExpressResponse,
  respond: BetterAuthResponder,
): Promise<unknown> {
  const headers = toFetchHeaders(req);
  const response = await respond(headers);

  forwardSetCookies(res, response);
  return readResponseBody(response);
}
