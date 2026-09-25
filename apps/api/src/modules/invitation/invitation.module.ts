import { Module } from "@nestjs/common";
import { DbModule } from "../../common/db/db.module";
import { InvitationController } from "./invitation.controller";
import { InvitationService } from "./invitation.service";

@Module({
  // DbModule: resendInvitation reads the invitation row directly.
  imports: [DbModule],
  controllers: [InvitationController],
  providers: [InvitationService],
})
export class InvitationModule {}
