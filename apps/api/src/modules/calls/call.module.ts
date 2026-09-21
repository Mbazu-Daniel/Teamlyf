import { Module } from "@nestjs/common";
import { EnvModule } from "../../common/config/env.module";
import { CallController } from "./call.controller";
import { CallService } from "./call.service";
import { BillingModule } from "../billing/billing.module";

@Module({
  imports: [EnvModule, BillingModule],
  controllers: [CallController],
  providers: [CallService],
})
export class CallModule {}
