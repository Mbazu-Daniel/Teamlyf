import { Module } from "@nestjs/common";
import { EnvModule } from "./common/config/env.module";
import { DbModule } from "./common/db/db.module";
import { AuthModule } from "./modules/auth/auth.module";
import { InvitationModule } from "./modules/invitation/invitation.module";
import { MemberModule } from "./modules/member/member.module";
import { OrganizationModule } from "./modules/organization/organization.module";
import { ProjectFeatureModule } from "./modules/project/project-feature.module";
import { NoteModule } from "./modules/notes/note.module";
import { HrModule } from "./modules/hr/hr.module";
import { RbacModule } from "./modules/rbac";
import { CallModule } from "./modules/calls/call.module";
import { BillingModule } from "./modules/billing/billing.module";

@Module({
  imports: [
    EnvModule,
    DbModule,
    AuthModule,
    RbacModule,
    CallModule,
    BillingModule,
    OrganizationModule,
    MemberModule,
    InvitationModule,
    ProjectFeatureModule,
    NoteModule,
    HrModule,
  ],
})
export class AppModule {}
