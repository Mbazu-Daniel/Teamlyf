import { Module } from "@nestjs/common";
import { DbModule } from "../../common/db/db.module";
import { EnvModule } from "../../common/config/env.module";
import { BillingController } from "./billing.controller";
import { BillingService } from "./billing.service";
import { FeatureGateGuard } from "./feature-gate";

@Module({
  imports: [DbModule, EnvModule],
  controllers: [BillingController],
  providers: [BillingService, FeatureGateGuard],
  exports: [FeatureGateGuard],
})
export class BillingModule {}
