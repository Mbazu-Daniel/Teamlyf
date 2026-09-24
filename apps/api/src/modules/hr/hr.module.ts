import { Module } from "@nestjs/common";
import { LeaveBalanceModule } from "./leave-balance/leave-balance.module";
import { LeavePolicyModule } from "./leave-policy/leave-policy.module";
import { LeaveRequestModule } from "./leave-request/leave-request.module";
import { MemberProfileModule } from "./member-profile/member-profile.module";

/** Aggregates the HR submodules: profiles, leave policies, leave requests, leave balances. */
@Module({
  imports: [MemberProfileModule, LeavePolicyModule, LeaveRequestModule, LeaveBalanceModule],
})
export class HrModule {}
