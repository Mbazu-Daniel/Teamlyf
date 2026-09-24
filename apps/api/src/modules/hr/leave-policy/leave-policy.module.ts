import { Module } from "@nestjs/common";
import { HrSharedModule } from "../hr-shared.module";
import { LeavePolicyController } from "./leave-policy.controller";
import { LeavePolicyService } from "./leave-policy.service";

@Module({
  imports: [HrSharedModule],
  controllers: [LeavePolicyController],
  providers: [LeavePolicyService],
  exports: [LeavePolicyService],
})
export class LeavePolicyModule {}
