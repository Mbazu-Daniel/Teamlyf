import { Injectable, NotFoundException } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { status } from "@teamlyf/db/project-schema";
import { and, eq } from "drizzle-orm";
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

  async createStatus(orgId: string, projectId: string, dto: CreateStatusDto) {
    await this.access.requireProject(orgId, projectId);

    const last = await this.db.query.status.findFirst({
      where: eq(status.projectId, projectId),
      orderBy: (s, { desc }) => [desc(s.sequence)],
    });

    const [created] = await this.db
      .insert(status)
      .values({
        projectId,
        name: dto.name,
        color: dto.color ?? "#60646C",
        group: dto.group ?? "todo",
        sequence: (last?.sequence ?? 0) + 15000,
      })
      .returning();
    return created;
  }

  async updateStatus(orgId: string, projectId: string, statusId: string, dto: UpdateStatusDto) {
    await this.access.requireProject(orgId, projectId);

    const found = await this.db.query.status.findFirst({
      where: and(eq(status.projectId, projectId), eq(status.id, statusId)),
    });
    if (!found) throw new NotFoundException("Status not found");

    const [updated] = await this.db
      .update(status)
      .set({ ...dto, updatedAt: new Date() })
      .where(and(eq(status.projectId, projectId), eq(status.id, statusId)))
      .returning();
    return updated;
  }

  async deleteStatus(orgId: string, projectId: string, statusId: string) {
    await this.access.requireProject(orgId, projectId);

    const found = await this.db.query.status.findFirst({
      where: and(eq(status.projectId, projectId), eq(status.id, statusId)),
    });
    if (!found) throw new NotFoundException("Status not found");

    await this.db
      .delete(status)
      .where(and(eq(status.projectId, projectId), eq(status.id, statusId)));
  }
}
