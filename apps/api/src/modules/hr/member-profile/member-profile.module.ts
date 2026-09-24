import { Module } from "@nestjs/common";
import { HrSharedModule } from "../hr-shared.module";
import { MemberProfileController } from "./member-profile.controller";
import { MemberProfileService } from "./member-profile.service";

@Module({
  imports: [HrSharedModule],
  controllers: [MemberProfileController],
  providers: [MemberProfileService],
})
export class MemberProfileModule {}
