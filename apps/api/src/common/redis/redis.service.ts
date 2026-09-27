import { Inject, Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { Redis } from "ioredis";
import { API_ENV } from "../config/env.module";
import type { ApiEnv } from "../config/env";

/**
 * Every instance subscribes here, so one publish reaches every replica. Lives
 * beside the service rather than in the module so the fan-out service can
 * depend on it without importing the module that provides the fan-out itself.
 */
export const REALTIME_CHANNEL = "teamlyf:realtime";

function redisRetryStrategy(times: number): number {
  return Math.min(1000 * 2 ** Math.min(times - 1, 4), 10_000);
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly instanceId = randomUUID();

  private readonly logger = new Logger(RedisService.name);
  // Separate connections: a subscriber is put into subscribe mode server-side
  // and cannot run normal commands, so one shared client would break publishing.
  private readonly publisher: Redis | null;
  private readonly subscriber: Redis | null;
  private readonly listeners = new Map<string, Set<(message: string) => void>>();
  private closing = false;

  readonly enabled: boolean;

  constructor(@Inject(API_ENV) env: ApiEnv) {
    this.enabled = Boolean(env.REDIS_URL);
    if (!env.REDIS_URL) {
      this.logger.log("REDIS_URL unset — presence and realtime stay process-local");
      this.publisher = null;
      this.subscriber = null;
      return;
    }

    const options = {
      retryStrategy: redisRetryStrategy,
      maxRetriesPerRequest: null as null,
      enableOfflineQueue: true,
    };
    this.publisher = new Redis(env.REDIS_URL, options);
    this.subscriber = new Redis(env.REDIS_URL, options);

    this.publisher.on("ready", () => this.logger.log("Redis publisher connected"));
    this.publisher.on("error", (error) => this.logger.warn(`Redis publisher: ${error.message}`));
    this.subscriber.on("ready", () => this.logger.log("Redis subscriber connected"));
    this.subscriber.on("error", (error) => this.logger.warn(`Redis subscriber: ${error.message}`));
    this.subscriber.on("message", (channel: string, message: string) => {
      for (const handler of this.listeners.get(channel) ?? []) handler(message);
    });
  }

  get ready(): boolean {
    return (
      this.enabled &&
      this.publisher?.status === "ready" &&
      this.subscriber?.status === "ready"
    );
  }

  get client(): Redis | null {
    return this.ready ? this.publisher : null;
  }

  async publish(channel: string, message: string): Promise<void> {
    if (!this.ready || this.closing) return;
    try {
      await this.publisher?.publish(channel, message);
    } catch (error) {
      this.logger.warn(`publish to ${channel} failed: ${(error as Error).message}`);
    }
  }

  subscribe(channel: string, handler: (message: string) => void): () => void {
    if (!this.enabled || !this.subscriber) return () => undefined;

    const set = this.listeners.get(channel) ?? new Set();
    set.add(handler);
    this.listeners.set(channel, set);

    if (set.size === 1) void this.subscriber.subscribe(channel).catch((error: Error) => {
      this.logger.warn(`subscribe to ${channel} failed: ${error.message}`);
    });

    return () => {
      const current = this.listeners.get(channel);
      if (!current) return;
      current.delete(handler);
      if (current.size === 0) {
        this.listeners.delete(channel);
        void this.subscriber?.unsubscribe(channel).catch(() => undefined);
      }
    };
  }

  async onModuleDestroy(): Promise<void> {
    this.closing = true;
    await Promise.all([this.publisher?.quit(), this.subscriber?.quit()].filter(Boolean));
  }
}