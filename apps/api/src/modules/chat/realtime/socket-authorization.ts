import type { AuthService } from "../../auth/auth.service";
import type { OrganizationPermissionService } from "../../rbac/organization-permission.service";
import type { AuthenticatedSocket } from "./ws-auth";

const actions: Record<string, string> = {
  "join-channel": "read", "send-channel-message": "create", "send-direct-message": "create",
  "typing-start": "create", "typing-stop": "read", "add-reaction": "update",
  "remove-reaction": "update", "delete-message": "update", "initiate-call": "create",
  "accept-call": "create", "reject-call": "read", "end-call": "read",
};

/** Recheck the session and current permissions on every event, not just at connect. */
export function authorizeSocketPackets(client: AuthenticatedSocket, auth: AuthService, permissions: OrganizationPermissionService) {
  client.use(async (packet, next) => {
    try {
      const action = actions[String(packet[0])];
      const headers = new Headers({ cookie: client.handshake.headers.cookie ?? "" });
      const session = await auth.auth.api.getSession({ headers });
      const allowed = action && session?.user.id === client.data.userId &&
        await permissions.checkUserPermission(client.data.userId, headers, client.data.organizationId, "chat", action);
      if (allowed) { next(); return; }
    } catch { /* Fail closed when session or permissions cannot be checked. */ }
    const acknowledgement = packet[packet.length - 1];
    const failure = { success: false, error: "Your session or chat permission no longer allows this action." };
    if (typeof acknowledgement === "function") acknowledgement(failure);
    else client.emit("exception", failure);
  });
}
