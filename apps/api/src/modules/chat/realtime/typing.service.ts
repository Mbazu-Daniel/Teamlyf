import { Injectable } from "@nestjs/common";
import { RedisService } from "../../../common/redis/redis.service";

/** A typing flag expires if the client never sends `typing-stop`. */
const TYPING_TTL_MS = 5000;
/** Abandoned room sets are dropped this long after their last write. */
const ROOM_TTL_SECONDS = 30;

const roomKey = (room: string) => `teamlyf:typing:${room}`;

/**
 * Room typing state for `user-typing` broadcasts, in Redis so a member typing
 * on instance A shows up for readers served by instance B.
 *
 * One sorted set per room, scored by expiry. That single detail replaces the
 * two in-process maps this used to need: expired flags are excluded by the
 * range query and swept on read, so there is no reverse room index and no
 * `clearMember` — a member who vanishes stops showing within the 5s TTL.
 *
 * Ordering matters: `set` must be awaited before `activeMemberIds`, or the
 * sender can read the room before their own flag lands.
 */
@Injectable()
export class ChatTypingService {
  constructor(private readonly redis: RedisService) {}

  async set(room: string, memberId: string): Promise<void> {
    const expiry = Date.now() + TYPING_TTL_MS;
    await this.redis.soft("typing.set", undefined, async () => {
      const pipeline = this.redis.client.pipeline();
      pipeline.zadd(roomKey(room), expiry, memberId);
      pipeline.expire(roomKey(room), ROOM_TTL_SECONDS);
      await pipeline.exec();
    });
  }

  async stop(room: string, memberId: string): Promise<void> {
    await this.redis.soft("typing.stop", undefined, async () => {
      await this.redis.client.zrem(roomKey(room), memberId);
    });
  }

  /** Live typing member ids for one room, expired flags swept away. */
  async activeMemberIds(room: string): Promise<string[]> {
    const now = Date.now();
    return this.redis.soft("typing.active", [] as string[], async () => {
      const pipeline = this.redis.client.pipeline();
      pipeline.zremrangebyscore(roomKey(room), "-inf", `(${now}`);
      pipeline.zrangebyscore(roomKey(room), `(${now}`, "+inf");
      const results = await pipeline.exec();
      return (results?.[1]?.[1] as string[] | null) ?? [];
    });
  }
}
