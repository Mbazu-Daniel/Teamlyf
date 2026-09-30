import { Global, Module } from "@nestjs/common";
import { EnvModule } from "../config/env.module";
import { RealtimeAdapterService } from "./realtime-adapter.service";
import { RedisService } from "./redis.service";

@Global()
@Module({
  imports: [EnvModule],
  providers: [RedisService, RealtimeAdapterService],
  exports: [RedisService, RealtimeAdapterService],
})
export class RedisModule {}
