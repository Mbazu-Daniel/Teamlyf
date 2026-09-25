import { Injectable, NotFoundException } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { label } from "@teamlyf/db/project-schema";
import { and, eq, inArray } from "drizzle-orm";
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

  async reorderLabels(orgId: string, projectId: string, labelIds: string[]) {
    await this.access.requireProject(orgId, projectId);

    const ids = [...new Set(labelIds)];
    const found = await this.db.query.label.findMany({
      where: and(eq(label.projectId, projectId), inArray(label.id, ids)),
      columns: { id: true },
    });
    if (found.length !== ids.length) {
      throw new NotFoundException("Labels not found in this project");
    }

    for (const [index, id] of ids.entries()) {
      await this.db.update(label).set({ sequence: (index + 1) * 1000 }).where(eq(label.id, id));
    }

    return this.getLabels(orgId, projectId);
  }

  async createLabel(orgId: string, projectId: string, dto: CreateLabelDto) {
    await this.access.requireProject(orgId, projectId);

    const last = await this.db.query.label.findFirst({
      where: eq(label.projectId, projectId),
      orderBy: (l, { desc }) => [desc(l.sequence)],
      columns: { sequence: true },
    });

    const [created] = await this.db
      .insert(label)
      .values({
        projectId,
        name: dto.name,
        // Absent values are left off the statement so the column keeps its
        // schema default (#60646C) rather than being re-typed here.
        color: dto.color,
        description: dto.description,
        parentId: dto.parentId,
        sequence: (last?.sequence ?? 0) + 10000,
      })
      .returning();
    return created;
  }

  /** The one lookup both the update and the delete start from. */
  private async requireLabel(projectId: string, labelId: string) {
    const found = await this.db.query.label.findFirst({
      where: and(eq(label.projectId, projectId), eq(label.id, labelId)),
    });
    if (!found) throw new NotFoundException("Label not found");
    return found;
  }

  async updateLabel(orgId: string, projectId: string, labelId: string, dto: UpdateLabelDto) {
    await this.access.requireProject(orgId, projectId);
    await this.requireLabel(projectId, labelId);

    const [updated] = await this.db
      .update(label)
      .set({ ...dto, updatedAt: new Date() })
      .where(and(eq(label.projectId, projectId), eq(label.id, labelId)))
      .returning();
    return updated;
  }

  async deleteLabel(orgId: string, projectId: string, labelId: string) {
    await this.access.requireProject(orgId, projectId);
    await this.requireLabel(projectId, labelId);

    await this.db
      .delete(label)
      .where(and(eq(label.projectId, projectId), eq(label.id, labelId)));
  }
}
