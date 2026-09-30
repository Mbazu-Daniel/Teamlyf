import { Controller, Get, Inject } from "@nestjs/common";
import { ApiExcludeEndpoint } from "@nestjs/swagger";
import { API_ENV } from "../config/env.module";
import type { ApiEnv } from "../config/env";
import { RedisService } from "../redis/redis.service";

/**
 * Liveness for the platform's health probe. Deliberately not under
 * `api/v1`: the probe path is configured once in the deploy UI and should not
 * move when the API version does.
 *
 * It answers "this process is up and configured", not "every dependency
 * answers" — a probe that fails on a slow database restarts a container that is
 * working fine. Redis is reported for visibility without gating the response.
 */
@Controller("health")
export class HealthController {
  constructor(
    @Inject(API_ENV) private readonly env: ApiEnv,
    private readonly redis: RedisService,
  ) {}

  @Get()
  @ApiExcludeEndpoint()
  check() {
    return {
      status: "ok",
      realtime: "redis",
      redis: this.redis.ready ? "ready" : "connecting",
      storage: this.env.R2_BUCKET_NAME ? "r2" : "unconfigured",
      uptimeSeconds: Math.round(process.uptime()),
    };
  }
}
