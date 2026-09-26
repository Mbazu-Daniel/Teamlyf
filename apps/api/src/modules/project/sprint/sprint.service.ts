import { Injectable, NotFoundException } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { project, sprint } from "@teamlyf/db/project-schema";
import { and, eq } from "drizzle-orm";
import { DATABASE } from "../../../common/db/db.provider";
import { ProjectAccessService } from "../project-access.service";
import type { CreateSprintDto, UpdateSprintDto } from "./dto";

@Injectable()
export class SprintService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly access: ProjectAccessService,
  ) {}

  async getSprints(orgId: string, projectId: string) {
    await this.access.requireProject(orgId, projectId);
    return this.db.query.sprint.findMany({
      where: and(eq(sprint.organizationId, orgId), eq(sprint.projectId, projectId)),
      orderBy: (s, { desc }) => [desc(s.createdAt)],
    });
  }

  async getSprint(orgId: string, projectId: string, sprintId: string) {
    await this.access.requireProject(orgId, projectId);
    const found = await this.db.query.sprint.findFirst({
      where: and(eq(sprint.organizationId, orgId), eq(sprint.projectId, projectId), eq(sprint.id, sprintId)),
    });
    if (!found) throw new NotFoundException("Sprint not found");
    return found;
  }

  async createSprint(orgId: string, projectId: string, dto: CreateSprintDto) {
    await this.access.requireProject(orgId, projectId);
    const [created] = await this.db.insert(sprint).values({
      organizationId: orgId,
      projectId,
      name: dto.name,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      status: dto.status ?? "planned",
    }).returning();
    return created;
  }

  async updateSprint(orgId: string, projectId: string, sprintId: string, dto: UpdateSprintDto) {
    await this.getSprint(orgId, projectId, sprintId);
    const [updated] = await this.db.update(sprint).set({
      name: dto.name,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      status: dto.status ?? "planned",
      updatedAt: new Date(),
    }).where(and(eq(sprint.id, sprintId), eq(sprint.projectId, projectId), eq(sprint.organizationId, orgId))).returning();
    return updated;
  }

  async deleteSprint(orgId: string, projectId: string, sprintId: string) {
    await this.getSprint(orgId, projectId, sprintId);
    await this.db.delete(sprint).where(and(eq(sprint.id, sprintId), eq(sprint.projectId, projectId), eq(sprint.organizationId, orgId)));
  }
}
