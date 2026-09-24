import { Module } from "@nestjs/common";
import { HrSharedModule } from "../hr-shared.module";
import { LeaveBalanceController } from "./leave-balance.controller";
import { LeaveBalanceService } from "./leave-balance.service";

@Module({
  imports: [HrSharedModule],
  controllers: [LeaveBalanceController],
  providers: [LeaveBalanceService],
})
export class LeaveBalanceModule {}
