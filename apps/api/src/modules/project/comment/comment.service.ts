import { Injectable, NotFoundException } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { taskComment } from "@teamlyf/db/project-schema";
import { and, eq, isNull } from "drizzle-orm";
import { DATABASE } from "../../../common/db/db.provider";
import { ProjectAccessService } from "../project-access.service";
import type { CreateCommentDto, UpdateCommentDto } from "./dto";

@Injectable()
export class CommentService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly access: ProjectAccessService,
  ) {}

  async getComments(orgId: string, projectId: string, taskId: string) {
    await this.access.requireTask(orgId, projectId, taskId);
    return this.db.query.taskComment.findMany({
      where: and(eq(taskComment.taskId, taskId), isNull(taskComment.parentId)),
      orderBy: (c, { desc }) => [desc(c.createdAt)],
    });
  }

  async createComment(
    orgId: string,
    projectId: string,
    taskId: string,
    dto: CreateCommentDto,
    memberId: string,
  ) {
    await this.access.requireTask(orgId, projectId, taskId);

    const [created] = await this.db
      .insert(taskComment)
      .values({
        taskId,
        parentId: dto.parentId ?? null,
        actorId: memberId,
        body: dto.body,
      })
      .returning();
    return created;
  }

  async updateComment(
    orgId: string,
    projectId: string,
    taskId: string,
    commentId: string,
    dto: UpdateCommentDto,
  ) {
    await this.access.requireTask(orgId, projectId, taskId);

    const found = await this.db.query.taskComment.findFirst({
      where: and(eq(taskComment.id, commentId), eq(taskComment.taskId, taskId)),
    });
    if (!found) throw new NotFoundException("Comment not found");

    const [updated] = await this.db
      .update(taskComment)
      .set({ body: dto.body, updatedAt: new Date() })
      .where(eq(taskComment.id, commentId))
      .returning();
    return updated;
  }

  async deleteComment(orgId: string, projectId: string, taskId: string, commentId: string) {
    await this.access.requireTask(orgId, projectId, taskId);

    const found = await this.db.query.taskComment.findFirst({
      where: and(eq(taskComment.id, commentId), eq(taskComment.taskId, taskId)),
    });
    if (!found) throw new NotFoundException("Comment not found");

    await this.db.delete(taskComment).where(eq(taskComment.id, commentId));
  }
}
