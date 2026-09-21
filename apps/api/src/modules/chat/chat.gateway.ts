import { Inject, Logger } from "@nestjs/common";
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import type { Database } from "@teamlyf/db";
import { member } from "@teamlyf/db/organization-schema";
import { channel, channelMember } from "@teamlyf/db/workspace-schema";
import { and, eq } from "drizzle-orm";
import { AuthService } from "../auth/auth.service";
import { DATABASE } from "../../common/db/db.provider";

@WebSocketGateway({ namespace: "/chat", cors: { origin: process.env.WEB_ORIGIN, credentials: true } })
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(ChatGateway.name);
  constructor(private readonly auth: AuthService, @Inject(DATABASE) private readonly db: Database) {}

  async handleConnection(socket: Socket) {
    const organizationId = typeof socket.handshake.auth.organizationId === "string" ? socket.handshake.auth.organizationId : undefined;
    const cookie = socket.handshake.headers.cookie;
    if (!organizationId || !cookie) return socket.disconnect(true);
    const headers = new Headers({ cookie });
    const session = await this.auth.auth.api.getSession({ headers }).catch(() => null);
    if (!session?.user?.id) return socket.disconnect(true);
    const found = await this.db.query.member.findFirst({ where: and(eq(member.organizationId, organizationId), eq(member.userId, session.user.id)) });
    if (!found) return socket.disconnect(true);
    socket.data.organizationId = organizationId;
    socket.data.memberId = found.id;
    await socket.join(`organization:${organizationId}`);
    const [publicChannels, memberships] = await Promise.all([
      this.db.query.channel.findMany({ where: eq(channel.organizationId, organizationId) }),
      this.db.query.channelMember.findMany({ where: eq(channelMember.memberId, found.id) }),
    ]);
    const memberChannels = new Set(memberships.map((item) => item.channelId));
    await socket.join(publicChannels.filter((item) => !item.isPrivate || memberChannels.has(item.id)).map((item) => `channel:${item.id}`));
  }

  emitMessage(organizationId: string, channelId: string, payload: unknown) {
    this.server.to(`channel:${channelId}`).emit("message.created", { organizationId, channelId, payload });
  }
}
