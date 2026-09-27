import { Global, Module } from "@nestjs/common";
import { EnvModule } from "../config/env.module";
import { RealtimeFanoutService } from "./realtime-fanout.service";
import { RedisService } from "./redis.service";

/**
 * Redis presence and cross-instance realtime fan-out. The service lives in its
 * own file so the fan-out service can depend on it without a module cycle.
 */
@Global()
@Module({
  imports: [EnvModule],
  providers: [RedisService, RealtimeFanoutService],
  exports: [RedisService, RealtimeFanoutService],
})
export class RedisModule {}