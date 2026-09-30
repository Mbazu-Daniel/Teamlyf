import { Inject, Logger } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type { Server } from "socket.io";
import type { Database } from "@teamlyf/db";
import { channel, channelMember } from "@teamlyf/db";
import { and, eq } from "drizzle-orm";
import { AuthService } from "../../auth/auth.service";
import { CallsService } from "../../calls/calls.service";
import { OrganizationPermissionService } from "../../rbac/organization-permission.service";
import { authorizeSocketPackets } from "./socket-authorization";
import { DATABASE } from "../../../common/db/db.provider";
import { webOrigins } from "../../../common/config/env";
import { RealtimeAdapterService } from "../../../common/redis/realtime-adapter.service";
import { ChannelMessageWriterService } from "../channels/channel-message-writer.service";
import { DirectMessagesService } from "../direct-messages/direct-messages.service";
import { MessageReactionsService } from "../reactions/message-reactions.service";
import { ChatPresenceService } from "../shared/presence.service";
import { CHAT_NAMESPACE_PATTERN, CHAT_ROOMS } from "../shared/rooms";
import { createChatAuthMiddleware, type AuthenticatedSocket } from "./ws-auth";
import { ChatTypingService } from "./typing.service";
import { errorMessage, parsePayloads } from "./socket-payloads";
import {
  applyReaction,
  deleteMessage,
  sendChannelMessage,
  sendDirectMessage,
  type MessageSocketDeps,
} from "./message-socket.handlers";
import {
  acceptCall,
  endCall,
  initiateCall,
  rejectCall,
  type CallSocketDeps,
} from "./call-socket.handlers";
import {
  emitTypingUsers,
  stopTypingBroadcast,
  typingRoom,
  requireTypingTarget,
  type TypingSocketDeps,
} from "./typing-socket.handlers";

/**
 * Resolved while the decorator below is evaluated, which is the only moment
 * Socket.IO accepts its options. `webOrigins()` runs `loadEnv()` first, so this
 * reads the same `.env` the REST layer validates against instead of a raw
 * `process.env` that may still be empty at this point.
 */
const corsOrigins = webOrigins();

@WebSocketGateway({
  namespace: CHAT_NAMESPACE_PATTERN as unknown as string,
  cors: {
    // Empty means WEB_ORIGIN is unset. Deny every origin rather than reflect
    // whatever asks: with `credentials` on, reflecting turns this into a
    // cross-site socket hijack on any site that can make the browser connect.
    origin: corsOrigins.length > 0 ? corsOrigins : false,
    credentials: true,
  },
  transports: ["websocket", "polling"],
  // Socket.IO defaults to 1 MB per frame. Our own caps reject an 8 kB body long
  // before this, so only a deliberate oversized blob reaches it.
  maxHttpBufferSize: 100_000,
})
export class ChatRealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatRealtimeGateway.name);

  private readonly messageDeps: MessageSocketDeps;

  private readonly callDeps: CallSocketDeps;

  private readonly typingDeps: TypingSocketDeps;

  constructor(
    private readonly auth: AuthService,
    private readonly permissions: OrganizationPermissionService,
    @Inject(DATABASE) private readonly db: Database,
    private readonly presence: ChatPresenceService,
    private readonly typing: ChatTypingService,
    private readonly dm: DirectMessagesService,
    private readonly writer: ChannelMessageWriterService,
    private readonly reactions: MessageReactionsService,
    private readonly calls: CallsService,
    private readonly realtime: RealtimeAdapterService,
  ) {
    this.typingDeps = { typing: this.typing, db: this.db };
    this.messageDeps = {
      db: this.db,
      writer: this.writer,
      dm: this.dm,
      reactions: this.reactions,
      stopTypingBroadcast: (client, room) => stopTypingBroadcast(client, room, this.typingDeps),
    };
    this.callDeps = { calls: this.calls, db: this.db };
  }

  afterInit(server: Server): void {
    // Adapter before any connection arrives — it is cloned into each
    // namespace as that namespace opens, and it is what makes every emit
    // below cross instances.
    this.realtime.attach(server);
    server.use(createChatAuthMiddleware(this.auth, this.db) as never);
  }

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    const { organizationId, memberId } = client.data ?? {};
    if (!organizationId || !memberId) {
      client.disconnect(true);
      return;
    }

    try {
      authorizeSocketPackets(client, this.auth, this.permissions);
      await this.presence.connect(organizationId, memberId, client.id);

      const [orgChannels, memberships] = await Promise.all([
        this.db.query.channel.findMany({
          where: eq(channel.organizationId, organizationId),
          columns: { id: true },
        }),
        this.db.query.channelMember.findMany({
          where: eq(channelMember.memberId, memberId),
          columns: { channelId: true },
        }),
      ]);
      const memberChannelIds = new Set(memberships.map((row) => row.channelId));
      const channelRooms = orgChannels
        .filter((row) => memberChannelIds.has(row.id))
        .map((row) => CHAT_ROOMS.channel(row.id));

      await client.join([
        CHAT_ROOMS.organization(organizationId),
        CHAT_ROOMS.member(memberId),
        ...channelRooms,
      ]);
      this.logger.log(`Chat socket connected: ${client.id} (member ${memberId})`);
    } catch (error) {
      this.logger.error(`Chat socket setup failed for ${client.id}: ${errorMessage(error)}`);
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: AuthenticatedSocket): Promise<void> {
    await this.presence.disconnect(client.id);
    this.logger.log(`Chat socket disconnected: ${client.id}`);
  }

  // The declared payload types are erased at runtime, so each handler bounds
  // its own body and returns `{ error }` rather than throwing into a disconnect.
  @SubscribeMessage("join-channel")
  async handleJoinChannel(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() raw: unknown,
  ): Promise<{ success: boolean; channelId: string } | { error: string }> {
    try {
      const { channelId } = parsePayloads.joinChannel(raw);
      const membership = await this.db.query.channelMember.findFirst({
        where: and(
          eq(channelMember.channelId, channelId),
          eq(channelMember.memberId, client.data.memberId),
        ),
      });
      if (!membership) return { error: "You are not a member of this channel" };
      await client.join(CHAT_ROOMS.channel(channelId));
      return { success: true, channelId };
    } catch (error) {
      return { error: errorMessage(error) };
    }
  }

  @SubscribeMessage("send-channel-message")
  async handleSendChannelMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() raw: unknown,
  ): Promise<unknown> {
    try {
      return await sendChannelMessage(
        client,
        parsePayloads.sendChannelMessage(raw),
        this.messageDeps,
      );
    } catch (error) {
      return { error: errorMessage(error) };
    }
  }

  @SubscribeMessage("send-direct-message")
  async handleSendDirectMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() raw: unknown,
  ): Promise<unknown> {
    try {
      return await sendDirectMessage(
        client,
        parsePayloads.sendDirectMessage(raw),
        this.messageDeps,
      );
    } catch (error) {
      return { error: errorMessage(error) };
    }
  }

  @SubscribeMessage("typing-start")
  async handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() raw: unknown,
  ): Promise<{ success: boolean } | { error: string }> {
    let data: ReturnType<typeof parsePayloads.typing>;
    try {
      data = parsePayloads.typing(raw);
    } catch (error) {
      return { error: errorMessage(error) };
    }
    const room = typingRoom(data);
    if (!room) return { error: "Channel ID or Recipient ID is required" };
    try {
      await requireTypingTarget(this.db, client, data);
    } catch (error) {
      return { error: errorMessage(error) };
    }
    await this.typing.set(room, client.data.memberId);
    client.nsp.to(CHAT_ROOMS.member(client.data.memberId)).emit("user-typing", {
      typingUsers: [{ id: client.data.memberId }],
      channelId: data.channelId,
      recipientId: data.recipientId,
    });
    await emitTypingUsers(client, room, this.typingDeps);
    return { success: true };
  }

  @SubscribeMessage("typing-stop")
  async handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() raw: unknown,
  ): Promise<{ success: boolean } | { error: string }> {
    let data: ReturnType<typeof parsePayloads.typing>;
    try {
      data = parsePayloads.typing(raw);
    } catch (error) {
      return { error: errorMessage(error) };
    }
    const room = typingRoom(data);
    if (room) await stopTypingBroadcast(client, room, this.typingDeps);
    client.nsp.to(CHAT_ROOMS.member(client.data.memberId)).emit("user-typing", {
      typingUsers: [],
      channelId: data.channelId,
      recipientId: data.recipientId,
    });
    return { success: true };
  }

  @SubscribeMessage("add-reaction")
  async handleAddReaction(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() raw: unknown,
  ): Promise<unknown> {
    try {
      return await applyReaction(client, parsePayloads.reaction(raw), true, this.messageDeps);
    } catch (error) {
      return { error: errorMessage(error) };
    }
  }

  @SubscribeMessage("remove-reaction")
  async handleRemoveReaction(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() raw: unknown,
  ): Promise<unknown> {
    try {
      return await applyReaction(client, parsePayloads.reaction(raw), false, this.messageDeps);
    } catch (error) {
      return { error: errorMessage(error) };
    }
  }

  @SubscribeMessage("delete-message")
  async handleDeleteMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() raw: unknown,
  ): Promise<unknown> {
    try {
      return await deleteMessage(client, parsePayloads.deleteMessage(raw), this.messageDeps);
    } catch (error) {
      return { error: errorMessage(error) };
    }
  }

  @SubscribeMessage("initiate-call")
  async handleInitiateCall(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() raw: unknown,
  ): Promise<unknown> {
    try {
      return await initiateCall(client, parsePayloads.initiateCall(raw), this.callDeps);
    } catch (error) {
      return { error: errorMessage(error) };
    }
  }

  @SubscribeMessage("accept-call")
  async handleAcceptCall(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() raw: unknown,
  ): Promise<unknown> {
    try {
      return await acceptCall(client, parsePayloads.callId(raw), this.callDeps);
    } catch (error) {
      return { error: errorMessage(error) };
    }
  }

  @SubscribeMessage("reject-call")
  async handleRejectCall(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() raw: unknown,
  ): Promise<unknown> {
    try {
      return await rejectCall(client, parsePayloads.callId(raw), this.callDeps);
    } catch (error) {
      return { error: errorMessage(error) };
    }
  }

  @SubscribeMessage("end-call")
  async handleEndCall(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() raw: unknown,
  ): Promise<unknown> {
    try {
      return await endCall(client, parsePayloads.callId(raw), this.callDeps);
    } catch (error) {
      return { error: errorMessage(error) };
    }
  }
}
