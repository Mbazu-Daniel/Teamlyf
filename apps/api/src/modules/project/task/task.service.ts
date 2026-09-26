import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { agent } from "@teamlyf/db";
import { member } from "@teamlyf/db/organization-schema";
import {
  milestoneTask,
  status,
  task,
  taskActivity,
  taskAssignee,
  taskLabel,
} from "@teamlyf/db/project-schema";
import { and, eq, inArray } from "drizzle-orm";
import { DATABASE } from "../../../common/db/db.provider";
import { ProjectAccessService } from "../project-access.service";
import type { CreateTaskDto, TaskAssigneeInputDto, UpdateTaskDto } from "./dto";

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
      orderBy: (t, { asc }) => [asc(t.sortOrder), asc(t.sequenceId)],
      with: { taskAssignees: true, taskLabels: true, milestoneTasks: true },
    });
  }

  async reorderTasks(orgId: string, projectId: string, taskIds: string[]) {
    await this.access.requireProject(orgId, projectId);

    const ids = [...new Set(taskIds)];
    const found = await this.db.query.task.findMany({
      where: and(eq(task.projectId, projectId), inArray(task.id, ids)),
      columns: { id: true },
    });
    if (found.length !== ids.length) {
      throw new NotFoundException("Tasks not found in this project");
    }

    for (const [index, id] of ids.entries()) {
      await this.db.update(task).set({ sortOrder: (index + 1) * 1000 }).where(eq(task.id, id));
    }

    return this.getTasks(orgId, projectId);
  }

  async getTask(orgId: string, projectId: string, taskId: string) {
    await this.access.requireTask(orgId, projectId, taskId);
    return this.db.query.task.findFirst({
      where: and(eq(task.projectId, projectId), eq(task.id, taskId)),
      with: { taskAssignees: true, taskLabels: true, milestoneTasks: true },
    });
  }

  async createTask(orgId: string, projectId: string, dto: CreateTaskDto, memberId: string) {
    await this.access.requireProject(orgId, projectId);

    const [statusRecord, last, lastSorted] = await Promise.all([
      this.db.query.status.findFirst({
        where: and(eq(status.id, dto.statusId), eq(status.projectId, projectId)),
      }),
      this.db.query.task.findFirst({
        where: eq(task.projectId, projectId),
        orderBy: (t, { desc }) => [desc(t.sequenceId)],
        columns: { sequenceId: true },
      }),
      this.db.query.task.findFirst({
        where: eq(task.projectId, projectId),
        orderBy: (t, { desc }) => [desc(t.sortOrder)],
        columns: { sortOrder: true },
      }),
    ]);
    if (!statusRecord) throw new BadRequestException("Invalid status for this project");

    const [created] = await this.db
      .insert(task)
      .values({
        projectId,
        statusId: dto.statusId,
        name: dto.name,
        completedAt: statusRecord.group === "done" ? new Date() : undefined,
        startDate: toDate(dto.startDate),
        targetDate: toDate(dto.targetDate),
        sequenceId: nextValue(last?.sequenceId),
        sortOrder: nextValue(lastSorted?.sortOrder),
        // Left off the statement when absent, so the column keeps its default.
        parentId: dto.parentId,
        description: dto.description,
        priority: dto.priority,
        createdById: memberId,
      })
      .returning();

    await this.updateTaskAssignees(orgId, created.id, dto.assignees);
    await this.updateTaskLabels(created.id, dto.labelIds);
    await this.updateTaskMilestones(created.id, dto.milestoneIds);
    await this.createActivity(created.id, memberId, "created");

    return this.db.query.task.findFirst({
      where: eq(task.id, created.id),
      with: { taskAssignees: true, taskLabels: true, milestoneTasks: true },
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
    const statusRecord = await this.resolveStatus(projectId, dto.statusId);

    const [updated] = await this.db
      .update(task)
      .set({
        completedAt: completedFor(statusRecord?.group, existing.completedAt),
        startDate: toDate(dto.startDate),
        targetDate: toDate(dto.targetDate),
        name: dto.name,
        description: dto.description,
        statusId: dto.statusId,
        parentId: dto.parentId,
        priority: dto.priority,
        updatedAt: new Date(),
      })
      .where(and(eq(task.projectId, projectId), eq(task.id, taskId)))
      .returning();

    await this.applyRelations(orgId, taskId, dto);
    await this.createFieldChanges(taskId, memberId, existing, dto);

    return updated;
  }

  /** A status change must name a status that belongs to this project. */
  private async resolveStatus(projectId: string, statusId: string | undefined) {
    if (!statusId) return null;
    const record = await this.db.query.status.findFirst({
      where: and(eq(status.id, statusId), eq(status.projectId, projectId)),
    });
    if (!record) throw new BadRequestException("Invalid status for this project");
    return record;
  }

  /**
   * Relations are replaced only when the payload mentions them: an update that
   * says nothing about labels must not empty the task.
   */
  private async applyRelations(orgId: string, taskId: string, dto: UpdateTaskDto) {
    if (dto.assignees) await this.updateTaskAssignees(orgId, taskId, dto.assignees);
    if (dto.labelIds) await this.updateTaskLabels(taskId, dto.labelIds);
    if (dto.milestoneIds) await this.updateTaskMilestones(taskId, dto.milestoneIds);
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

  // fallow-ignore-next-line complexity -- assignee validation handles two organization-scoped actor types and relation replacement
  private async updateTaskAssignees(
    orgId: string,
    taskId: string,
    assignees: TaskAssigneeInputDto[] = [],
  ) {
    for (const assignee of assignees) {
      if (assignee.kind === "member") {
        const found = await this.db.query.member.findFirst({
          where: and(eq(member.id, assignee.id), eq(member.organizationId, orgId)),
        });
        if (!found) throw new BadRequestException(`Member ${assignee.id} not in organization`);
      } else {
        const found = await this.db.query.agent.findFirst({
          where: and(eq(agent.id, assignee.id), eq(agent.organizationId, orgId)),
        });
        if (!found) throw new BadRequestException(`Agent ${assignee.id} not in organization`);
        if (!found.enabled) throw new BadRequestException(`Agent ${assignee.id} is disabled`);
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

  private async updateTaskLabels(taskId: string, labelIds: string[] = []) {
    await this.db.delete(taskLabel).where(eq(taskLabel.taskId, taskId));
    if (!labelIds.length) return;
    await this.db.insert(taskLabel).values(labelIds.map((labelId) => ({ taskId, labelId })));
  }

  private async updateTaskMilestones(taskId: string, milestoneIds: string[] = []) {
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

/** The next value in a 1-based run; an empty project starts at 1. */
function nextValue(previous: number | null | undefined) {
  return (previous ?? 0) + 1;
}

/** ISO date in, Date out. Absent stays absent so drizzle omits the column. */
function toDate(value: string | undefined) {
  return value ? new Date(value) : undefined;
}

/** Entering the done group stamps completion; leaving it keeps what was there. */
function completedFor(group: string | undefined, previous: Date | null) {
  return group === "done" ? new Date() : previous;
}
