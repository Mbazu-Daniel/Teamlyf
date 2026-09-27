import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import type { Namespace, Server as IoServer } from "socket.io";
import { REALTIME_CHANNEL, RedisService } from "./redis.service";

export type FanoutTarget = {
  namespace: string;
  room: string;
  event: string;
  payload: unknown;
  /** Local only: the socket that caused this emit, so it does not receive its own event. */
  except?: string;
};

type Envelope = {
  v: 1;
  origin: string;
  namespace: string;
  room: string;
  event: string;
  payload: unknown;
};

/** A pattern gateway is handed either the Server or its Namespace; both reach the root. */
function rootServer(handle: unknown): IoServer {
  const candidate = handle as { server?: IoServer; of?: unknown };
  if (candidate.server && typeof candidate.server.of === "function") return candidate.server;
  if (typeof candidate.of === "function") return handle as IoServer;
  throw new Error("realtime fan-out attached to neither a socket.io Server nor a Namespace");
}

@Injectable()
export class RealtimeFanoutService implements OnModuleDestroy {
  private readonly logger = new Logger(RealtimeFanoutService.name);
  private server: IoServer | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor(private readonly redis: RedisService) {}

  attach(server: unknown): void {
    this.server = rootServer(server);
    this.unsubscribe = this.redis.subscribe(REALTIME_CHANNEL, (message) => this.onRemote(message));
    this.logger.log(
      this.redis.enabled
        ? "Realtime fan-out attached (cross-instance via Redis)"
        : "Realtime fan-out attached (process-local; set REDIS_URL for cross-instance)",
    );
  }

  publish(target: FanoutTarget): void {
    this.emitLocal(target);
    if (!this.redis.ready) return;

    const envelope: Envelope = {
      v: 1,
      origin: this.redis.instanceId,
      namespace: target.namespace,
      room: target.room,
      event: target.event,
      payload: target.payload,
    };
    void this.redis.publish(REALTIME_CHANNEL, JSON.stringify(envelope));
  }

  private emitLocal(target: FanoutTarget): void {
    if (!this.server) return;
    try {
      const nsp: Namespace = this.server.of(target.namespace);
      let operation = nsp.to(target.room);
      if (target.except) operation = operation.except(target.except);
      operation.emit(target.event, target.payload);
    } catch (error) {
      this.logger.warn(`local emit of ${target.event} to ${target.room} failed: ${(error as Error).message}`);
    }
  }

  private onRemote(message: string): void {
    let envelope: Envelope;
    try {
      envelope = JSON.parse(message) as Envelope;
    } catch {
      return;
    }
    if (envelope.origin === this.redis.instanceId) return;
    if (envelope.v !== 1) return;
    this.emitLocal(envelope);
  }

  onModuleDestroy(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.server = null;
  }
}
