import { Module } from "@nestjs/common";
import { EnvModule } from "./common/config/env.module";
import { DbModule } from "./common/db/db.module";
import { AuthModule } from "./modules/auth/auth.module";
import { InvitationModule } from "./modules/invitation/invitation.module";
import { MemberModule } from "./modules/member/member.module";
import { OrganizationModule } from "./modules/organization/organization.module";
import { ProjectFeatureModule } from "./modules/project/project-feature.module";
import { RbacModule } from "./modules/rbac";
import { AgentModule } from "./modules/agents/agent.module";
import { ChatModule } from "./modules/chat/chat.module";
import { DocumentModule } from "./modules/documents/document.module";
import { NoteModule } from "./modules/notes/note.module";
import { HrModule } from "./modules/hr/hr.module";
import { BillingModule } from "./modules/billing/billing.module";
import { CallModule } from "./modules/calls/call.module";
import { EmailModule } from "./common/email/email.module";
import { WorkspaceModule } from "./modules/workspace/workspace.module";

@Module({
  imports: [
    EnvModule,
    EmailModule,
    DbModule,
    AuthModule,
    RbacModule,
    AgentModule,
    ChatModule,
    DocumentModule,
    NoteModule,
    HrModule,
    BillingModule,
    CallModule,
    WorkspaceModule,
    OrganizationModule,
    MemberModule,
    InvitationModule,
    ProjectFeatureModule,
  ],
})
export class AppModule {}
