import { Injectable, NotFoundException } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { label } from "@teamlyf/db/project-schema";
import { and, eq } from "drizzle-orm";
import { DATABASE } from "../../../common/db/db.provider";
import { ProjectAccessService } from "../project-access.service";
import type { CreateLabelDto, UpdateLabelDto } from "./dto";

@Injectable()
export class LabelService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly access: ProjectAccessService,
  ) {}

  async getLabels(orgId: string, projectId: string) {
    await this.access.requireProject(orgId, projectId);
    return this.db.query.label.findMany({
      where: eq(label.projectId, projectId),
      orderBy: (l, { asc }) => [asc(l.sequence)],
    });
  }

  async createLabel(orgId: string, projectId: string, dto: CreateLabelDto) {
    await this.access.requireProject(orgId, projectId);

    const last = await this.db.query.label.findFirst({
      where: eq(label.projectId, projectId),
      orderBy: (l, { desc }) => [desc(l.sequence)],
    });

    const [created] = await this.db
      .insert(label)
      .values({
        projectId,
        name: dto.name,
        color: dto.color ?? "#60646C",
        description: dto.description ?? null,
        parentId: dto.parentId ?? null,
        sequence: (last?.sequence ?? 0) + 10000,
      })
      .returning();
    return created;
  }

  async updateLabel(orgId: string, projectId: string, labelId: string, dto: UpdateLabelDto) {
    await this.access.requireProject(orgId, projectId);

    const found = await this.db.query.label.findFirst({
      where: and(eq(label.projectId, projectId), eq(label.id, labelId)),
    });
    if (!found) throw new NotFoundException("Label not found");

    const [updated] = await this.db
      .update(label)
      .set({ ...dto, updatedAt: new Date() })
      .where(and(eq(label.projectId, projectId), eq(label.id, labelId)))
      .returning();
    return updated;
  }

  async deleteLabel(orgId: string, projectId: string, labelId: string) {
    await this.access.requireProject(orgId, projectId);

    const found = await this.db.query.label.findFirst({
      where: and(eq(label.projectId, projectId), eq(label.id, labelId)),
    });
    if (!found) throw new NotFoundException("Label not found");

    await this.db
      .delete(label)
      .where(and(eq(label.projectId, projectId), eq(label.id, labelId)));
  }
}
