import { Injectable, NotFoundException } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { project, task } from "@teamlyf/db/project-schema";
import { and, eq } from "drizzle-orm";
import { DATABASE } from "../../common/db/db.provider";

@Injectable()
export class ProjectAccessService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async requireProject(orgId: string, projectId: string) {
    const found = await this.db.query.project.findFirst({
      where: and(eq(project.organizationId, orgId), eq(project.id, projectId)),
    });
    if (!found) throw new NotFoundException("Project not found");
    return found;
  }

  async requireTask(orgId: string, projectId: string, taskId: string) {
    await this.requireProject(orgId, projectId);
    const found = await this.db.query.task.findFirst({
      where: and(eq(task.projectId, projectId), eq(task.id, taskId)),
    });
    if (!found) throw new NotFoundException("Task not found");
    return found;
  }
}
