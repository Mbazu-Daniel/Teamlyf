import { Global, Module } from "@nestjs/common";
import { RedisModule } from "../redis/redis.module";
import { HealthController } from "./health.controller";

/**
 * `@Global` so the probe needs no import chain from `AppModule`; the controller
 * is self-contained and safe to register anywhere.
 */
@Global()
@Module({
  imports: [RedisModule],
  controllers: [HealthController],
})
export class HealthModule {}
