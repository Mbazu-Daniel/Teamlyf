import { Module } from "@nestjs/common";
import { HrSharedModule } from "../hr-shared.module";
import { EmergencyContactController } from "./emergency-contact.controller";
import { MemberProfileController } from "./member-profile.controller";
import { MemberProfileService } from "./member-profile.service";

@Module({
  imports: [HrSharedModule],
  controllers: [MemberProfileController, EmergencyContactController],
  providers: [MemberProfileService],
})
export class MemberProfileModule {}
