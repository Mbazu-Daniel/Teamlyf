import { Module } from "@nestjs/common";
import { EnvModule } from "./common/config/env.module";
import { DbModule } from "./common/db/db.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ChatModule } from "./modules/chat/chat.module";
import { InvitationModule } from "./modules/invitation/invitation.module";
import { MemberModule } from "./modules/member/member.module";
import { OrganizationModule } from "./modules/organization/organization.module";
import { ProjectFeatureModule } from "./modules/project/project-feature.module";
import { RbacModule } from "./modules/rbac";

@Module({
  imports: [
    EnvModule,
    DbModule,
    AuthModule,
    ChatModule,
    RbacModule,
    OrganizationModule,
    MemberModule,
    InvitationModule,
    ProjectFeatureModule,
  ],
})
export class AppModule {}
