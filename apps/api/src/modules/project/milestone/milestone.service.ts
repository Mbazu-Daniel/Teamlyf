import { Injectable, NotFoundException } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { milestone, milestoneTask } from "@teamlyf/db/project-schema";
import { and, eq } from "drizzle-orm";
import { DATABASE } from "../../../common/db/db.provider";
import { ProjectAccessService } from "../project-access.service";
import type { CreateMilestoneDto, UpdateMilestoneDto } from "./dto";

@Injectable()
export class MilestoneService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly access: ProjectAccessService,
  ) {}

  async getMilestones(orgId: string, projectId: string) {
    await this.access.requireProject(orgId, projectId);
    return this.db.query.milestone.findMany({
      where: eq(milestone.projectId, projectId),
      orderBy: (m, { desc }) => [desc(m.createdAt)],
      with: { milestoneTasks: true },
    });
  }

  async createMilestone(orgId: string, projectId: string, dto: CreateMilestoneDto, memberId: string) {
    await this.access.requireProject(orgId, projectId);

    const [created] = await this.db
      .insert(milestone)
      .values({
        projectId,
        name: dto.name,
        description: dto.description ?? null,
        status: dto.status ?? "planned",
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
        createdById: memberId,
      })
      .returning();
    return created;
  }

  async updateMilestone(
    orgId: string,
    projectId: string,
    milestoneId: string,
    dto: UpdateMilestoneDto,
  ) {
    await this.access.requireProject(orgId, projectId);

    const found = await this.db.query.milestone.findFirst({
      where: and(eq(milestone.projectId, projectId), eq(milestone.id, milestoneId)),
    });
    if (!found) throw new NotFoundException("Milestone not found");

    const [updated] = await this.db
      .update(milestone)
      .set({
        name: dto.name,
        description: dto.description,
        status: dto.status,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : undefined,
        updatedAt: new Date(),
      })
      .where(and(eq(milestone.projectId, projectId), eq(milestone.id, milestoneId)))
      .returning();
    return updated;
  }

  async deleteMilestone(orgId: string, projectId: string, milestoneId: string) {
    await this.access.requireProject(orgId, projectId);

    const found = await this.db.query.milestone.findFirst({
      where: and(eq(milestone.projectId, projectId), eq(milestone.id, milestoneId)),
    });
    if (!found) throw new NotFoundException("Milestone not found");

    await this.db
      .delete(milestone)
      .where(and(eq(milestone.projectId, projectId), eq(milestone.id, milestoneId)));
  }

  async createMilestoneTask(
    orgId: string,
    projectId: string,
    milestoneId: string,
    taskId: string,
  ) {
    await this.access.requireTask(orgId, projectId, taskId);

    const found = await this.db.query.milestone.findFirst({
      where: and(eq(milestone.projectId, projectId), eq(milestone.id, milestoneId)),
    });
    if (!found) throw new NotFoundException("Milestone not found");

    const [created] = await this.db
      .insert(milestoneTask)
      .values({ milestoneId, taskId })
      .returning();
    return created;
  }

  async deleteMilestoneTask(
    orgId: string,
    projectId: string,
    milestoneId: string,
    taskId: string,
  ) {
    await this.access.requireTask(orgId, projectId, taskId);

    await this.db
      .delete(milestoneTask)
      .where(and(eq(milestoneTask.milestoneId, milestoneId), eq(milestoneTask.taskId, taskId)));
  }
}
