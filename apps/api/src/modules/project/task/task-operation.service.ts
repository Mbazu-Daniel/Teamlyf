import { BadRequestException, Injectable } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { member } from "@teamlyf/db/organization-schema";
import { status, task, taskActivity, taskAssignee } from "@teamlyf/db/project-schema";
import { and, eq } from "drizzle-orm";
import { DATABASE } from "../../../common/db/db.provider";
import { ProjectAccessService } from "../project-access.service";
import { TaskService } from "./task.service";

@Injectable()
export class TaskOperationService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly access: ProjectAccessService,
    private readonly tasks: TaskService,
  ) {}

  async updateStatus(orgId: string, projectId: string, taskId: string, statusId: string, actorId: string) {
    await this.access.requireTask(orgId, projectId, taskId);
    const target = await this.db.query.status.findFirst({ where: and(eq(status.id, statusId), eq(status.projectId, projectId)) });
    if (!target) throw new BadRequestException("Invalid status for this project");
    return this.tasks.updateTask(orgId, projectId, taskId, { statusId }, actorId);
  }

  async assign(orgId: string, projectId: string, taskId: string, assigneeId: string, actorId: string) {
    await this.access.requireTask(orgId, projectId, taskId);
    const assignee = await this.db.query.member.findFirst({ where: and(eq(member.id, assigneeId), eq(member.organizationId, orgId)) });
    if (!assignee) throw new BadRequestException("Member is not part of this organization");
    await this.db.delete(taskAssignee).where(eq(taskAssignee.taskId, taskId));
    await this.db.insert(taskAssignee).values({ taskId, kind: "member", memberId: assigneeId, agentId: null });
    await this.db.insert(taskActivity).values({ taskId, actorId, verb: "assigned" });
    return this.tasks.getTask(orgId, projectId, taskId);
  }
}
