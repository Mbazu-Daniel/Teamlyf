import { and, eq } from "drizzle-orm";
import type { Socket } from "socket.io";
import type { Database } from "@teamlyf/db";
import { member } from "@teamlyf/db";
import type { AuthService } from "../../auth/auth.service";
import { organizationFromNamespace } from "../shared/rooms";

export type SocketData = { organizationId: string; memberId: string };

/** A socket past the handshake middleware, with org + member pinned down. */
export type AuthenticatedSocket = Socket & { data: SocketData };

/**
 * Namespace auth middleware, registered once in the gateway's `afterInit` and
 * inherited by every `/organization/:orgId/chat` child namespace (socket.io
 * copies parent `_fns` at child creation). Resolves the better-auth session
 * cookie to an org member — the same lookup `OrgMemberGuard` does for REST.
 */
export function createChatAuthMiddleware(auth: AuthService, db: Database) {
  return async (socket: Socket, next: (error?: Error) => void): Promise<void> => {
    try {
      const organizationId = organizationFromNamespace(socket.nsp.name);
      const cookie = socket.handshake.headers.cookie;
      if (!organizationId || !cookie) {
        next(new Error("Unauthorized"));
        return;
      }
      const session = await auth.auth.api.getSession({ headers: new Headers({ cookie }) }).catch(() => null);
      if (!session?.user?.id) {
        next(new Error("Unauthorized"));
        return;
      }
      const found = await db.query.member.findFirst({
        where: and(eq(member.organizationId, organizationId), eq(member.userId, session.user.id)),
      });
      if (!found) {
        next(new Error("Forbidden"));
        return;
      }
      socket.data = { ...(socket.data as Partial<SocketData>), organizationId, memberId: found.id };
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  };
}
