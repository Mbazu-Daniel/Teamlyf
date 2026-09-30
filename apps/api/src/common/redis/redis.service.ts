import { Inject, Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { Redis } from "ioredis";
import { API_ENV } from "../config/env.module";
import type { ApiEnv } from "../config/env";

function redisRetryStrategy(times: number): number {
  return Math.min(1000 * 2 ** Math.min(times - 1, 4), 10_000);
}

const REDIS_OPTIONS = {
  retryStrategy: redisRetryStrategy,
  maxRetriesPerRequest: null as null,
  enableOfflineQueue: true,
} as const;

@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly instanceId = randomUUID();

  private readonly logger = new Logger(RedisService.name);
  private readonly clients: Redis[] = [];
  private readonly url: string;

  readonly client: Redis;

  constructor(@Inject(API_ENV) env: ApiEnv) {
    this.url = env.REDIS_URL;
    this.client = this.connect("app");
  }

  get ready(): boolean {
    return this.client.status === "ready";
  }

  duplicate(label: string): Redis {
    return this.connect(label);
  }

  async soft<T>(label: string, fallback: T, run: () => Promise<T>): Promise<T> {
    try {
      return await run();
    } catch (error) {
      this.logger.warn(`${label}: ${(error as Error).message}`);
      return fallback;
    }
  }

  private connect(label: string): Redis {
    const client = new Redis(this.url, REDIS_OPTIONS);
    client.on("ready", () => this.logger.log(`Redis ${label} connected`));
    client.on("error", (error) => this.logger.warn(`Redis ${label}: ${error.message}`));
    this.clients.push(client);
    return client;
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.allSettled(this.clients.map((client) => client.quit()));
  }
}
