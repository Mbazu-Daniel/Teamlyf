import { BadRequestException, Injectable } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { member } from "@teamlyf/db/organization-schema";
import {
  milestoneTask,
  status,
  task,
  taskActivity,
  taskAssignee,
  taskLabel,
} from "@teamlyf/db/project-schema";
import { and, eq } from "drizzle-orm";
import { DATABASE } from "../../../common/db/db.provider";
import { ProjectAccessService } from "../project-access.service";
import type { CreateTaskDto, TaskAssigneeInputDto, UpdateTaskDto } from "../dto";

@Injectable()
export class TaskService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly access: ProjectAccessService,
  ) {}

  async getTasks(orgId: string, projectId: string) {
    await this.access.requireProject(orgId, projectId);
    return this.db.query.task.findMany({
      where: eq(task.projectId, projectId),
      orderBy: (t, { asc }) => [asc(t.sortOrder)],
      with: { taskAssignees: true, taskLabels: true },
    });
  }

  async getTask(orgId: string, projectId: string, taskId: string) {
    await this.access.requireTask(orgId, projectId, taskId);
    return this.db.query.task.findFirst({
      where: and(eq(task.projectId, projectId), eq(task.id, taskId)),
      with: { taskAssignees: true, taskLabels: true },
    });
  }

  async createTask(orgId: string, projectId: string, dto: CreateTaskDto, memberId: string) {
    await this.access.requireProject(orgId, projectId);

    const [statusRecord, last] = await Promise.all([
      this.db.query.status.findFirst({
        where: and(eq(status.id, dto.statusId), eq(status.projectId, projectId)),
      }),
      this.db.query.task.findFirst({
        where: eq(task.projectId, projectId),
        orderBy: (t, { desc }) => [desc(t.sequenceId)],
      }),
    ]);
    if (!statusRecord) throw new BadRequestException("Invalid status for this project");

    const [created] = await this.db
      .insert(task)
      .values({
        projectId,
        statusId: dto.statusId,
        parentId: dto.parentId ?? null,
        name: dto.name,
        description: dto.description ?? null,
        priority: dto.priority ?? "none",
        sequenceId: (last?.sequenceId ?? 0) + 1,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
        completedAt: statusRecord.group === "done" ? new Date() : null,
        createdById: memberId,
      })
      .returning();

    await this.updateTaskAssignees(orgId, created.id, dto.assignees ?? []);
    await this.updateTaskLabels(created.id, dto.labelIds ?? []);
    await this.updateTaskMilestones(created.id, dto.milestoneIds ?? []);
    await this.createActivity(created.id, memberId, "created");

    return this.db.query.task.findFirst({
      where: eq(task.id, created.id),
      with: { taskAssignees: true, taskLabels: true },
    });
  }

  async updateTask(
    orgId: string,
    projectId: string,
    taskId: string,
    dto: UpdateTaskDto,
    memberId: string,
  ) {
    const existing = await this.access.requireTask(orgId, projectId, taskId);

    const statusRecord = dto.statusId
      ? await this.db.query.status.findFirst({
          where: and(eq(status.id, dto.statusId), eq(status.projectId, projectId)),
        })
      : null;
    if (dto.statusId && !statusRecord) {
      throw new BadRequestException("Invalid status for this project");
    }

    const [updated] = await this.db
      .update(task)
      .set({
        name: dto.name,
        description: dto.description,
        statusId: dto.statusId,
        parentId: dto.parentId,
        priority: dto.priority,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
        completedAt: statusRecord?.group === "done" ? new Date() : existing.completedAt,
        updatedAt: new Date(),
      })
      .where(and(eq(task.projectId, projectId), eq(task.id, taskId)))
      .returning();

    if (dto.assignees) await this.updateTaskAssignees(orgId, taskId, dto.assignees);
    if (dto.labelIds) await this.updateTaskLabels(taskId, dto.labelIds);
    if (dto.milestoneIds) await this.updateTaskMilestones(taskId, dto.milestoneIds);
    await this.createFieldChanges(taskId, memberId, existing, dto);

    return updated;
  }

  async deleteTask(orgId: string, projectId: string, taskId: string) {
    await this.access.requireTask(orgId, projectId, taskId);
    await this.db.delete(task).where(and(eq(task.projectId, projectId), eq(task.id, taskId)));
  }

  async getActivity(orgId: string, projectId: string, taskId: string) {
    await this.access.requireTask(orgId, projectId, taskId);
    return this.db.query.taskActivity.findMany({
      where: eq(taskActivity.taskId, taskId),
      orderBy: (a, { desc: d }) => [d(a.createdAt)],
    });
  }

  private async updateTaskAssignees(orgId: string, taskId: string, assignees: TaskAssigneeInputDto[]) {
    for (const assignee of assignees) {
      if (assignee.kind === "member") {
        const found = await this.db.query.member.findFirst({
          where: and(eq(member.id, assignee.id), eq(member.organizationId, orgId)),
        });
        if (!found) throw new BadRequestException(`Member ${assignee.id} not in organization`);
      }
    }

    await this.db.delete(taskAssignee).where(eq(taskAssignee.taskId, taskId));
    if (!assignees.length) return;

    await this.db.insert(taskAssignee).values(
      assignees.map((a) => ({
        taskId,
        kind: a.kind,
        memberId: a.kind === "member" ? a.id : null,
        agentId: a.kind === "agent" ? a.id : null,
      })),
    );
  }

  private async updateTaskLabels(taskId: string, labelIds: string[]) {
    await this.db.delete(taskLabel).where(eq(taskLabel.taskId, taskId));
    if (!labelIds.length) return;
    await this.db.insert(taskLabel).values(labelIds.map((labelId) => ({ taskId, labelId })));
  }

  private async updateTaskMilestones(taskId: string, milestoneIds: string[]) {
    await this.db.delete(milestoneTask).where(eq(milestoneTask.taskId, taskId));
    if (!milestoneIds.length) return;
    await this.db
      .insert(milestoneTask)
      .values(milestoneIds.map((milestoneId) => ({ milestoneId, taskId })));
  }

  private async createActivity(taskId: string, actorId: string, verb: string) {
    await this.db.insert(taskActivity).values({ taskId, actorId, verb });
  }

  private async createFieldChanges(
    taskId: string,
    memberId: string,
    existing: {
      name: string;
      statusId: string;
      priority: string;
      startDate: Date | null;
      targetDate: Date | null;
    },
    dto: UpdateTaskDto,
  ) {
    const fields = ["name", "statusId", "priority", "startDate", "targetDate"] as const;
    const changes = fields
      .filter((f) => dto[f] !== undefined && String(dto[f] ?? "") !== String(existing[f] ?? ""))
      .map((f) => ({
        taskId,
        actorId: memberId,
        verb: "updated" as const,
        field: f,
        oldValue: String(existing[f] ?? ""),
        newValue: String(dto[f] ?? ""),
      }));

    if (changes.length) {
      await this.db.insert(taskActivity).values(changes);
    }
  }
}
