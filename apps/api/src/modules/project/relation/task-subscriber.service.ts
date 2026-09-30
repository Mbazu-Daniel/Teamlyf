import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { member } from "@teamlyf/db/organization-schema";
import { taskActivity, taskSubscriber } from "@teamlyf/db/project-schema";
import { and, eq } from "drizzle-orm";
import { DATABASE } from "../../../common/db/db.provider";
import { ProjectAccessService } from "../project-access.service";
import type { CreateTaskSubscriberDto } from "../task/dto";

@Injectable()
export class TaskSubscriberService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly access: ProjectAccessService,
  ) {}

  async getSubscribers(orgId: string, projectId: string, taskId: string) {
    await this.access.requireTask(orgId, projectId, taskId);
    return this.db.query.taskSubscriber.findMany({
      where: and(eq(taskSubscriber.organizationId, orgId), eq(taskSubscriber.taskId, taskId)),
      with: {
        member: { columns: { id: true, firstName: true, lastName: true, userId: true } },
      },
      orderBy: (s, { asc }) => [asc(s.createdAt)],
    });
  }

  async subscribe(
    orgId: string,
    projectId: string,
    taskId: string,
    dto: CreateTaskSubscriberDto,
    actorId: string,
  ) {
    await this.access.requireTask(orgId, projectId, taskId);

    const memberRow = await this.db.query.member.findFirst({
      where: and(eq(member.id, dto.memberId), eq(member.organizationId, orgId)),
      columns: { id: true },
    });
    if (!memberRow) throw new BadRequestException(`Member ${dto.memberId} not in organization`);

    const existing = await this.db.query.taskSubscriber.findFirst({
      where: and(eq(taskSubscriber.taskId, taskId), eq(taskSubscriber.memberId, dto.memberId)),
    });
    if (existing) {
      if (!dto.preferences) return existing;
      const [updated] = await this.db
        .update(taskSubscriber)
        .set({ preferences: dto.preferences })
        .where(eq(taskSubscriber.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await this.db
      .insert(taskSubscriber)
      .values({
        taskId,
        organizationId: orgId,
        memberId: dto.memberId,
        preferences: dto.preferences ?? {},
      })
      .returning();

    await this.db.insert(taskActivity).values({
      taskId,
      actorId,
      verb: "created",
      field: "subscriber",
      newValue: dto.memberId,
    });
    return created;
  }

  async unsubscribe(
    orgId: string,
    projectId: string,
    taskId: string,
    subscriberMemberId: string,
    actorId: string,
  ) {
    await this.access.requireTask(orgId, projectId, taskId);
    const found = await this.db.query.taskSubscriber.findFirst({
      where: and(
        eq(taskSubscriber.taskId, taskId),
        eq(taskSubscriber.memberId, subscriberMemberId),
        eq(taskSubscriber.organizationId, orgId),
      ),
    });
    if (!found) throw new NotFoundException("Subscriber not found");

    await this.db.delete(taskSubscriber).where(eq(taskSubscriber.id, found.id));
    await this.db.insert(taskActivity).values({
      taskId,
      actorId,
      verb: "deleted",
      field: "subscriber",
      oldValue: subscriberMemberId,
    });
  }
}
