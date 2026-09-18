import { Module } from "@nestjs/common";
import { EnvModule } from "./common/config/env.module";
import { DbModule } from "./common/db/db.module";
import { AuthModule } from "./modules/auth/auth.module";
import { OrganizationModule } from "./modules/organization/organization.module";
import { MemberModule } from "./modules/member/member.module";
import { InvitationModule } from "./modules/invitation/invitation.module";

@Module({
  imports: [
    EnvModule,
    DbModule,
    AuthModule,
    OrganizationModule,
    MemberModule,
    InvitationModule,
  ],
})
export class AppModule {}
