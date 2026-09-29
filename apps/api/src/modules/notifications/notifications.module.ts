import {
  Body,
  Controller,
  Get,
  Inject,
  Injectable,
  Module,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ArrayMaxSize, ArrayUnique, IsArray, IsUUID } from "class-validator";
import {
  type Database,
  member,
  notificationRead,
  project,
  task,
  taskActivity,
  taskAssignee,
  taskSubscriber,
  user,
} from "@teamlyf/db";
import { and, desc, eq, exists, inArray, isNull, ne, or } from "drizzle-orm";
import { DATABASE } from "../../common/db/db.provider";
import { DbModule } from "../../common/db/db.module";
import { SessionGuard } from "../../common/better-auth/session.guard";
import type { SessionMember } from "../../common/types";
import { CurrentMember, OrgMemberGuard, PermissionsGuard, RequirePermission } from "../rbac";

class ReadInput {
  @IsArray() @ArrayUnique() @ArrayMaxSize(100) @IsUUID(undefined, { each: true }) ids!: string[];
}
@Injectable()
class NotificationsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}
  private relevant(memberId: string) {
    return and(
      or(isNull(taskActivity.actorId), ne(taskActivity.actorId, memberId)),
      or(
        exists(
          this.db
            .select({ id: taskAssignee.id })
            .from(taskAssignee)
            .where(and(eq(taskAssignee.taskId, task.id), eq(taskAssignee.memberId, memberId))),
        ),
        exists(
          this.db
            .select({ id: taskSubscriber.id })
            .from(taskSubscriber)
            .where(and(eq(taskSubscriber.taskId, task.id), eq(taskSubscriber.memberId, memberId))),
        ),
      ),
    );
  }
  async list(org: string, memberId: string, activity: boolean, offset: number) {
    const rows = await this.db
      .select({
        id: taskActivity.id,
        taskId: task.id,
        taskName: task.name,
        projectId: project.id,
        projectName: project.name,
        actor: user.name,
        verb: taskActivity.verb,
        field: taskActivity.field,
        createdAt: taskActivity.createdAt,
        readAt: notificationRead.readAt,
      })
      .from(taskActivity)
      .innerJoin(task, eq(taskActivity.taskId, task.id))
      .innerJoin(project, eq(task.projectId, project.id))
      .leftJoin(member, eq(taskActivity.actorId, member.id))
      .leftJoin(user, eq(member.userId, user.id))
      .leftJoin(
        notificationRead,
        and(
          eq(notificationRead.activityId, taskActivity.id),
          eq(notificationRead.memberId, memberId),
        ),
      )
      .where(and(eq(project.organizationId, org), activity ? undefined : this.relevant(memberId)))
      .orderBy(desc(taskActivity.createdAt), desc(taskActivity.id))
      .limit(51)
      .offset(offset);
    return { items: rows.slice(0, 50), hasMore: rows.length > 50 };
  }
  async read(org: string, memberId: string, ids: string[]) {
    if (!ids.length) return { success: true };
    const allowed = await this.db
      .select({ id: taskActivity.id })
      .from(taskActivity)
      .innerJoin(task, eq(taskActivity.taskId, task.id))
      .innerJoin(project, eq(task.projectId, project.id))
      .where(
        and(
          eq(project.organizationId, org),
          inArray(taskActivity.id, ids),
          this.relevant(memberId),
        ),
      );
    if (allowed.length)
      await this.db
        .insert(notificationRead)
        .values(allowed.map((row) => ({ activityId: row.id, memberId })))
        .onConflictDoNothing();
    return { success: true };
  }
}

@Controller("organization/:orgId/notifications")
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}
  @Get()
  @RequirePermission("pm", "read")
  list(
    @Param("orgId") org: string,
    @CurrentMember() member: SessionMember,
    @Query("scope") scope?: string,
    @Query("offset") offset?: string,
  ) {
    const value = Number(offset ?? 0);
    return this.notifications.list(
      org,
      member.id,
      scope === "activity",
      Number.isSafeInteger(value) && value >= 0 ? value : 0,
    );
  }
  @Post("read")
  @RequirePermission("pm", "read")
  read(
    @Param("orgId") org: string,
    @CurrentMember() member: SessionMember,
    @Body() input: ReadInput,
  ) {
    return this.notifications.read(org, member.id, input.ids);
  }
}
@Module({
  imports: [DbModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
