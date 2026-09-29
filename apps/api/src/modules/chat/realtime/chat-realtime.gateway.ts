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
import { ChannelMessageWriterService } from "../channels/channel-message-writer.service";
import { DirectMessagesService } from "../direct-messages/direct-messages.service";
import { MessageReactionsService } from "../reactions/message-reactions.service";
import { ChatPresenceService } from "../shared/presence.service";
import { CHAT_NAMESPACE_PATTERN, CHAT_ROOMS } from "../shared/rooms";
import { createChatAuthMiddleware, type AuthenticatedSocket } from "./ws-auth";
import { ChatTypingService } from "./typing.service";
import {
  errorMessage,
  type CallIdPayload,
  type DeleteMessagePayload,
  type InitiateCallPayload,
  type JoinChannelPayload,
  type ReactionPayload,
  type SendChannelMessagePayload,
  type SendDirectMessagePayload,
  type TypingPayload,
} from "./socket-payloads";
import {
  applyReaction,
  deleteMessage,
  sendChannelMessage,
  sendDirectMessage,
  type MessageSocketDeps,
} from "./message-socket.handlers";
import { acceptCall, endCall, initiateCall, rejectCall, type CallSocketDeps } from "./call-socket.handlers";
import {
  emitTypingUsers,
  stopTypingBroadcast,
  typingRoom,
  requireTypingTarget,
  type TypingSocketDeps,
} from "./typing-socket.handlers";

const corsOrigins = (process.env.WEB_ORIGIN ?? "")
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean);

/**
 * Single socket gateway for `/organization/:orgId/chat` — one class on the
 * namespace pattern on purpose: socket.io fans a RegExp namespace out to a
 * parent namespace, so a second gateway class would attach to an orphan parent
 * and never receive connections. All emits go through `client.nsp` (the real
 * child namespace) or `client.broadcast`; never through the parent server.
 *
 * Event contract (what the web client speaks):
 * - in:  join-channel, send-channel-message, send-direct-message,
 *        typing-start, typing-stop, add-reaction, remove-reaction,
 *        delete-message, initiate-call, accept-call, reject-call, end-call
 * - out: new-channel-message, new-direct-message, user-typing,
 *        reaction-added, reaction-removed, message-deleted,
 *        direct-message-deleted, call-initiated, call-accepted,
 *        call-rejected, call-ended
 */
@WebSocketGateway({
  namespace: CHAT_NAMESPACE_PATTERN as unknown as string,
  cors: { origin: corsOrigins.length > 0 ? corsOrigins : true, credentials: true },
  transports: ["websocket", "polling"],
})
export class ChatRealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatRealtimeGateway.name);

  /** Deps handed to `message-socket.handlers.ts` — plain functions, no `this`. */
  private readonly messageDeps: MessageSocketDeps;

  /** Deps handed to `call-socket.handlers.ts` — plain functions, no `this`. */
  private readonly callDeps: CallSocketDeps;

  /** Deps handed to `typing-socket.handlers.ts` — plain functions, no `this`. */
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
      this.presence.connect(organizationId, memberId, client.id);

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

      await client.join([CHAT_ROOMS.organization(organizationId), CHAT_ROOMS.member(memberId), ...channelRooms]);
      this.logger.log(`Chat socket connected: ${client.id} (member ${memberId})`);
    } catch (error) {
      this.logger.error(`Chat socket setup failed for ${client.id}: ${errorMessage(error)}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    const left = this.presence.disconnect(client.id);
    if (left?.becameOffline) this.typing.clearMember(left.memberId);
    this.logger.log(`Chat socket disconnected: ${client.id}`);
  }
  // ------------------------------------------------------------ chat events

  @SubscribeMessage("join-channel")
  async handleJoinChannel(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: JoinChannelPayload,
  ): Promise<{ success: boolean; channelId: string } | { error: string }> {
    try {
      const channelId = data?.channelId;
      if (typeof channelId !== "string" || !channelId) return { error: "Channel ID is required" };
      const membership = await this.db.query.channelMember.findFirst({
        where: and(eq(channelMember.channelId, channelId), eq(channelMember.memberId, client.data.memberId)),
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
    @MessageBody() data: SendChannelMessagePayload,
  ): Promise<unknown> {
    return sendChannelMessage(client, data, this.messageDeps);
  }

  @SubscribeMessage("send-direct-message")
  async handleSendDirectMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: SendDirectMessagePayload,
  ): Promise<unknown> {
    return sendDirectMessage(client, data, this.messageDeps);
  }
  // ---------------------------------------------------------------- typing

  @SubscribeMessage("typing-start")
  async handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: TypingPayload,
  ): Promise<{ success: boolean } | { error: string }> {
    const room = typingRoom(data);
    if (!room) return { error: "Channel ID or Recipient ID is required" };
    try { await requireTypingTarget(this.db, client, data); }
    catch (error) { return { error: errorMessage(error) }; }
    this.typing.set(room, client.data.memberId);
    client.nsp.to(CHAT_ROOMS.member(client.data.memberId)).emit("user-typing", {
      typingUsers: [{ id: client.data.memberId }],
      channelId: data?.channelId,
      recipientId: data?.recipientId,
    });
    await emitTypingUsers(client, room, this.typingDeps);
    return { success: true };
  }

  @SubscribeMessage("typing-stop")
  async handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: TypingPayload,
  ): Promise<{ success: boolean }> {
    const room = typingRoom(data);
    if (room) await stopTypingBroadcast(client, room, this.typingDeps);
    client.nsp.to(CHAT_ROOMS.member(client.data.memberId)).emit("user-typing", {
      typingUsers: [],
      channelId: data?.channelId,
      recipientId: data?.recipientId,
    });
    return { success: true };
  }
  // ------------------------------------------------------------- reactions

  @SubscribeMessage("add-reaction")
  async handleAddReaction(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: ReactionPayload,
  ): Promise<unknown> {
    return applyReaction(client, data, true, this.messageDeps);
  }

  @SubscribeMessage("remove-reaction")
  async handleRemoveReaction(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: ReactionPayload,
  ): Promise<unknown> {
    return applyReaction(client, data, false, this.messageDeps);
  }

  @SubscribeMessage("delete-message")
  async handleDeleteMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: DeleteMessagePayload,
  ): Promise<unknown> {
    return deleteMessage(client, data, this.messageDeps);
  }
  // ----------------------------------------------------------------- calls

  @SubscribeMessage("initiate-call")
  async handleInitiateCall(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: InitiateCallPayload,
  ): Promise<unknown> {
    return initiateCall(client, data, this.callDeps);
  }

  @SubscribeMessage("accept-call")
  async handleAcceptCall(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: CallIdPayload,
  ): Promise<unknown> {
    return acceptCall(client, data, this.callDeps);
  }

  @SubscribeMessage("reject-call")
  async handleRejectCall(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: CallIdPayload,
  ): Promise<unknown> {
    return rejectCall(client, data, this.callDeps);
  }

  @SubscribeMessage("end-call")
  async handleEndCall(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: CallIdPayload,
  ): Promise<unknown> {
    return endCall(client, data, this.callDeps);
  }
}
