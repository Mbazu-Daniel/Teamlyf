import { Module } from "@nestjs/common";
import { ScheduleModule } from "./modules/schedule/schedule.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { EnvModule } from "./common/config/env.module";
import { DbModule } from "./common/db/db.module";
import { RedisModule } from "./common/redis/redis.module";
import { HealthModule } from "./common/health/health.module";
import { AuthModule } from "./modules/auth/auth.module";
import { DocumentModule } from "./modules/documents/document.module";
import { InvitationModule } from "./modules/invitation/invitation.module";
import { MemberModule } from "./modules/member/member.module";
import { OrganizationModule } from "./modules/organization/organization.module";
import { ProjectFeatureModule } from "./modules/project/project-feature.module";
import { NoteModule } from "./modules/notes/note.module";
import { HrModule } from "./modules/hr/hr.module";
import { RbacModule } from "./modules/rbac";
import { BillingModule } from "./modules/billing/billing.module";
import { AgentModule } from "./modules/agents/agent.module";
import { ChatModule } from "./modules/chat/chat.module";
import { EmailModule } from "./modules/email";
import { RealtimeModule } from "./modules/chat/realtime/realtime.module";

@Module({
  imports: [
    ScheduleModule,
    NotificationsModule,
    EnvModule,
    DbModule,
    RedisModule,
    AuthModule,
    DocumentModule,
    RbacModule,
    BillingModule,
    AgentModule,
    OrganizationModule,
    MemberModule,
    InvitationModule,
    ProjectFeatureModule,
    NoteModule,
    HrModule,
    RealtimeModule,
    ChatModule,
    EmailModule,
    HealthModule,
  ],
})
export class AppModule {}
