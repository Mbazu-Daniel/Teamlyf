import { Module } from "@nestjs/common";
import { LeavePolicyModule } from "../leave-policy/leave-policy.module";
import { HrSharedModule } from "../hr-shared.module";
import { LeaveRequestController } from "./leave-request.controller";
import { LeaveRequestService } from "./leave-request.service";

@Module({
  imports: [HrSharedModule, LeavePolicyModule],
  controllers: [LeaveRequestController],
  providers: [LeaveRequestService],
})
export class LeaveRequestModule {}
