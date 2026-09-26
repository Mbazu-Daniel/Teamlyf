import { Injectable, NotFoundException } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { taskAttachment } from "@teamlyf/db/project-schema";
import { and, eq } from "drizzle-orm";
import { DATABASE } from "../../../common/db/db.provider";
import { ProjectAccessService } from "../project-access.service";
import type { CreateTaskAttachmentDto } from "./dto";

@Injectable()
export class AttachmentService {
  constructor(@Inject(DATABASE) private readonly db: Database, private readonly access: ProjectAccessService) {}
  async list(orgId: string, projectId: string, taskId: string) { await this.access.requireTask(orgId, projectId, taskId); return this.db.query.taskAttachment.findMany({ where: eq(taskAttachment.taskId, taskId), orderBy: (a, { asc }) => [asc(a.createdAt)] }); }
  async create(orgId: string, projectId: string, taskId: string, memberId: string, dto: CreateTaskAttachmentDto) { await this.access.requireTask(orgId, projectId, taskId); const [created] = await this.db.insert(taskAttachment).values({ taskId, memberId, name: dto.name, url: dto.url, mimeType: dto.mimeType ?? null, size: dto.size ?? null }).returning(); return created; }
  async remove(orgId: string, projectId: string, taskId: string, attachmentId: string) { await this.access.requireTask(orgId, projectId, taskId); const [deleted] = await this.db.delete(taskAttachment).where(and(eq(taskAttachment.id, attachmentId), eq(taskAttachment.taskId, taskId))).returning({ id: taskAttachment.id }); if (!deleted) throw new NotFoundException("Attachment not found"); }
}
