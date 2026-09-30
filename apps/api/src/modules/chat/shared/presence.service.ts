import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { RedisService } from "../../../common/redis/redis.service";

type SocketOwner = { organizationId: string; memberId: string };

const SOCKET_TTL_SECONDS = 60;
const HEARTBEAT_MS = 20_000;

const socketKey = (socketId: string) => `teamlyf:presence:socket:${socketId}`;
const memberKey = (memberId: string) => `teamlyf:presence:member:${memberId}`;

@Injectable()
export class ChatPresenceService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ChatPresenceService.name);
  private readonly sockets = new Map<string, SocketOwner>();
  private heartbeat: NodeJS.Timeout | null = null;

  constructor(private readonly redis: RedisService) {}

  onModuleInit(): void {
    this.heartbeat = setInterval(() => void this.refreshAll(), HEARTBEAT_MS);
    this.heartbeat.unref();
  }

  async connect(organizationId: string, memberId: string, socketId: string): Promise<void> {
    this.sockets.set(socketId, { organizationId, memberId });
    const expiry = Date.now() + SOCKET_TTL_SECONDS * 1000;

    await this.redis.soft("presence.connect", undefined, async () => {
      const pipeline = this.redis.client.pipeline();
      pipeline.set(
        socketKey(socketId),
        JSON.stringify({ organizationId, memberId }),
        "EX",
        SOCKET_TTL_SECONDS,
      );
      pipeline.zadd(memberKey(memberId), expiry, socketId);
      await pipeline.exec();
    });
  }

  async disconnect(socketId: string): Promise<(SocketOwner & { becameOffline: boolean }) | null> {
    const owner = this.sockets.get(socketId) ?? (await this.readOwner(socketId));
    this.sockets.delete(socketId);
    if (!owner) return null;

    const becameOffline = await this.redis.soft("presence.disconnect", true, async () => {
      const pipeline = this.redis.client.pipeline();
      pipeline.del(socketKey(socketId));
      pipeline.zrem(memberKey(owner.memberId), socketId);
      pipeline.zcard(memberKey(owner.memberId));
      const results = await pipeline.exec();
      const [, remaining] = results?.[2] ?? [null, 0];
      return Number(remaining ?? 0) === 0;
    });

    return { ...owner, becameOffline };
  }

  async isOnline(memberId: string): Promise<boolean> {
    const presence = await this.presenceFor([memberId]);
    return presence.get(memberId) ?? false;
  }

  async presenceFor(memberIds: readonly string[]): Promise<Map<string, boolean>> {
    const ids = [...new Set(memberIds)];
    const online = new Map<string, boolean>(ids.map((id) => [id, false]));
    if (ids.length === 0) return online;

    const now = Date.now();
    const flags = await this.redis.soft("presence.query", [] as boolean[], async () => {
      const pipeline = this.redis.client.pipeline();
      for (const id of ids) pipeline.zcount(memberKey(id), `(${now}`, "+inf");
      const results = await pipeline.exec();
      return (results ?? []).map(([, value]) => Number(value ?? 0) > 0);
    });

    ids.forEach((id, index) => online.set(id, flags[index] ?? false));
    return online;
  }

  private async refreshAll(): Promise<void> {
    if (this.sockets.size === 0) return;
    await this.redis.soft("presence.heartbeat", undefined, async () => {
      const expiry = Date.now() + SOCKET_TTL_SECONDS * 1000;
      const pipeline = this.redis.client.pipeline();
      for (const [socketId, owner] of this.sockets) {
        pipeline.set(socketKey(socketId), JSON.stringify(owner), "EX", SOCKET_TTL_SECONDS);
        pipeline.zadd(memberKey(owner.memberId), expiry, socketId);
      }
      await pipeline.exec();
    });
  }

  private async readOwner(socketId: string): Promise<SocketOwner | null> {
    const raw = await this.redis.soft("presence.owner", null as string | null, () =>
      this.redis.client.get(socketKey(socketId)),
    );
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Partial<SocketOwner>;
      if (!parsed.organizationId || !parsed.memberId) return null;
      return { organizationId: parsed.organizationId, memberId: parsed.memberId };
    } catch {
      return null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.heartbeat) clearInterval(this.heartbeat);
    this.heartbeat = null;

    const owned = [...this.sockets.entries()];
    this.sockets.clear();
    if (owned.length === 0) return;

    // A rolling deploy must drop presence immediately, not leave members
    // online for the remaining socket TTL.
    await this.redis.soft("presence.shutdown", undefined, async () => {
      const members = new Map<string, string[]>();
      const pipeline = this.redis.client.pipeline();
      for (const [socketId, owner] of owned) {
        pipeline.del(socketKey(socketId));
        members.set(owner.memberId, [...(members.get(owner.memberId) ?? []), socketId]);
      }
      for (const [memberId, socketIds] of members) pipeline.zrem(memberKey(memberId), ...socketIds);
      await pipeline.exec();
    });
    this.logger.log(`Presence cleared for ${owned.length} socket(s) on shutdown`);
  }
}
