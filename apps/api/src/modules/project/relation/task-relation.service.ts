import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { task, taskActivity, taskRelation } from "@teamlyf/db/project-schema";
import { and, eq, or } from "drizzle-orm";
import { DATABASE } from "../../../common/db/db.provider";
import { ProjectAccessService } from "../project-access.service";
import type { CreateTaskRelationDto } from "../task/dto";

@Injectable()
export class TaskRelationService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly access: ProjectAccessService,
  ) {}

  async getRelations(orgId: string, projectId: string, taskId: string) {
    await this.access.requireTask(orgId, projectId, taskId);
    return this.db.query.taskRelation.findMany({
      where: and(
        eq(taskRelation.organizationId, orgId),
        or(eq(taskRelation.sourceTaskId, taskId), eq(taskRelation.targetTaskId, taskId)),
      ),
      with: {
        sourceTask: { columns: { id: true, name: true, sequenceId: true } },
        targetTask: { columns: { id: true, name: true, sequenceId: true } },
      },
      orderBy: (r, { desc }) => [desc(r.createdAt)],
    });
  }

  async createRelation(
    orgId: string,
    projectId: string,
    taskId: string,
    dto: CreateTaskRelationDto,
    memberId: string,
  ) {
    await this.access.requireTask(orgId, projectId, taskId);
    if (dto.targetTaskId === taskId) {
      throw new BadRequestException("A task cannot relate to itself");
    }

    const target = await this.db.query.task.findFirst({
      where: and(eq(task.id, dto.targetTaskId), eq(task.projectId, projectId)),
      columns: { id: true },
    });
    if (!target) throw new NotFoundException("Target task not found in this project");

    const [created] = await this.db
      .insert(taskRelation)
      .values({
        organizationId: orgId,
        sourceTaskId: taskId,
        targetTaskId: dto.targetTaskId,
        relationType: dto.relationType,
      })
      .onConflictDoNothing()
      .returning();
    if (!created) throw new BadRequestException("This relation already exists");

    await this.db.insert(taskActivity).values({
      taskId,
      actorId: memberId,
      verb: "created",
      field: "relation",
      newValue: dto.relationType,
    });
    return created;
  }

  async deleteRelation(
    orgId: string,
    projectId: string,
    taskId: string,
    relationId: string,
    memberId: string,
  ) {
    const relation = await this.requireRelation(orgId, projectId, taskId, relationId);
    await this.db.delete(taskRelation).where(eq(taskRelation.id, relation.id));
    await this.db.insert(taskActivity).values({
      taskId,
      actorId: memberId,
      verb: "deleted",
      field: "relation",
      oldValue: relation.relationType,
    });
  }

  private async requireRelation(
    orgId: string,
    projectId: string,
    taskId: string,
    relationId: string,
  ) {
    await this.access.requireTask(orgId, projectId, taskId);
    const found = await this.db.query.taskRelation.findFirst({
      where: and(
        eq(taskRelation.id, relationId),
        eq(taskRelation.organizationId, orgId),
        or(eq(taskRelation.sourceTaskId, taskId), eq(taskRelation.targetTaskId, taskId)),
      ),
    });
    if (!found) throw new NotFoundException("Relation not found");
    return found;
  }
}
