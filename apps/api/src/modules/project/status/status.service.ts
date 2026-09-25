import { Injectable, NotFoundException } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { status } from "@teamlyf/db/project-schema";
import { and, eq, inArray } from "drizzle-orm";
import { DATABASE } from "../../../common/db/db.provider";
import { ProjectAccessService } from "../project-access.service";
import type { CreateStatusDto, UpdateStatusDto } from "./dto";

@Injectable()
export class StatusService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly access: ProjectAccessService,
  ) {}

  async getStatuses(orgId: string, projectId: string) {
    await this.access.requireProject(orgId, projectId);
    return this.db.query.status.findMany({
      where: eq(status.projectId, projectId),
      orderBy: (s, { asc }) => [asc(s.sequence)],
    });
  }

  async reorderStatuses(orgId: string, projectId: string, statusIds: string[]) {
    await this.access.requireProject(orgId, projectId);

    const ids = [...new Set(statusIds)];
    const found = await this.db.query.status.findMany({
      where: and(eq(status.projectId, projectId), inArray(status.id, ids)),
      columns: { id: true },
    });
    if (found.length !== ids.length) {
      throw new NotFoundException("Statuses not found in this project");
    }

    for (const [index, id] of ids.entries()) {
      await this.db.update(status).set({ sequence: (index + 1) * 1000 }).where(eq(status.id, id));
    }

    return this.getStatuses(orgId, projectId);
  }

  async createStatus(orgId: string, projectId: string, dto: CreateStatusDto) {
    await this.access.requireProject(orgId, projectId);

    const last = await this.db.query.status.findFirst({
      where: eq(status.projectId, projectId),
      orderBy: (s, { desc }) => [desc(s.sequence)],
      columns: { sequence: true },
    });

    const [created] = await this.db
      .insert(status)
      .values({
        projectId,
        name: dto.name,
        // Absent values are left off the statement so the column keeps its
        // schema default (#60646C, todo) rather than being re-typed here.
        color: dto.color,
        group: dto.group,
        sequence: (last?.sequence ?? 0) + 15000,
      })
      .returning();
    return created;
  }

  /** The one lookup both the update and the delete start from. */
  private async requireStatus(projectId: string, statusId: string) {
    const found = await this.db.query.status.findFirst({
      where: and(eq(status.projectId, projectId), eq(status.id, statusId)),
    });
    if (!found) throw new NotFoundException("Status not found");
    return found;
  }

  async updateStatus(orgId: string, projectId: string, statusId: string, dto: UpdateStatusDto) {
    await this.access.requireProject(orgId, projectId);
    await this.requireStatus(projectId, statusId);

    const [updated] = await this.db
      .update(status)
      .set({ ...dto, updatedAt: new Date() })
      .where(and(eq(status.projectId, projectId), eq(status.id, statusId)))
      .returning();
    return updated;
  }

  async deleteStatus(orgId: string, projectId: string, statusId: string) {
    await this.access.requireProject(orgId, projectId);
    await this.requireStatus(projectId, statusId);

    await this.db
      .delete(status)
      .where(and(eq(status.projectId, projectId), eq(status.id, statusId)));
  }
}
