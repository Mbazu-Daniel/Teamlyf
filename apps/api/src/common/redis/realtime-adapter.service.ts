import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { createAdapter } from "@socket.io/redis-adapter";
import type { Redis } from "ioredis";
import type { Namespace, Server as IoServer } from "socket.io";
import { RedisService } from "./redis.service";

/** A pattern gateway is handed either the Server or its Namespace; both reach the root. */
function rootServer(handle: unknown): IoServer {
  const candidate = handle as { server?: IoServer; of?: unknown };
  if (candidate.server && typeof candidate.server.of === "function") return candidate.server;
  if (typeof candidate.of === "function") return handle as IoServer;
  throw new Error("realtime adapter attached to neither a socket.io Server nor a Namespace");
}

/**
 * Installs Socket.IO's Redis adapter on the root server. From that point every
 * `nsp.to(room).emit(...)` and `socket.broadcast` on any namespace is relayed
 * through Redis, so a client on instance A sees what instance B emitted — and
 * `except`/sender-exclusion propagates too, because the adapter carries the
 * originating socket id in the payload.
 *
 * This is why no emit call site changes: the adapter intercepts at
 * `Namespace._emit`, which every existing emit already goes through. Routing
 * emits through a wrapper instead would make cross-instance delivery a
 * convention each new emit site has to remember.
 *
 * Must run in `afterInit`, before the first connection: the adapter is cloned
 * into each namespace as that namespace opens.
 */
@Injectable()
export class RealtimeAdapterService implements OnModuleDestroy {
  private readonly logger = new Logger(RealtimeAdapterService.name);
  private readonly clients: Redis[] = [];

  constructor(private readonly redis: RedisService) {}

  attach(server: unknown): void {
    const root = rootServer(server);
    // The adapter owns subscribe/psubscribe on the second client, so it gets a
    // dedicated pair rather than the shared app connection.
    const pub = this.redis.duplicate("adapter publisher");
    const sub = this.redis.duplicate("adapter subscriber");
    this.clients.push(pub, sub);
    root.adapter(createAdapter(pub, sub));
    this.logger.log("Socket.IO Redis adapter attached (cross-instance fan-out active)");
  }

  onModuleDestroy(): void {
    for (const client of this.clients) void client.quit().catch(() => undefined);
    this.clients.length = 0;
  }
}
