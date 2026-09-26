import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { directMessage } from "@teamlyf/db/chat-schema";
import { member } from "@teamlyf/db/organization-schema";
import { and, desc, eq, or } from "drizzle-orm";
import { DATABASE } from "../../../common/db/db.provider";
import type { CreateDirectMessageDto } from "./dto";

@Injectable()
export class DirectMessageService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}
  async list(organizationId: string, memberId: string, otherMemberId: string) {
    await this.requireMember(organizationId, otherMemberId);
    return this.db.query.directMessage.findMany({ where: and(eq(directMessage.organizationId, organizationId), or(and(eq(directMessage.senderId, memberId), eq(directMessage.recipientId, otherMemberId)), and(eq(directMessage.senderId, otherMemberId), eq(directMessage.recipientId, memberId)))), orderBy: [desc(directMessage.createdAt)], limit: 100 });
  }
  async send(organizationId: string, senderId: string, dto: CreateDirectMessageDto) {
    await this.requireMember(organizationId, dto.recipientId);
    if (senderId === dto.recipientId) throw new BadRequestException("Cannot send a direct message to yourself");
    const [created] = await this.db.insert(directMessage).values({ organizationId, senderId, recipientId: dto.recipientId, content: dto.content, parentMessageId: dto.parentMessageId ?? null }).returning();
    return created;
  }
  async markRead(organizationId: string, memberId: string, messageId: string) {
    const [updated] = await this.db.update(directMessage).set({ readAt: new Date() }).where(and(eq(directMessage.id, messageId), eq(directMessage.organizationId, organizationId), eq(directMessage.recipientId, memberId))).returning();
    if (!updated) throw new NotFoundException("Direct message not found");
    return updated;
  }
  private async requireMember(organizationId: string, memberId: string) {
    const found = await this.db.query.member.findFirst({ where: and(eq(member.id, memberId), eq(member.organizationId, organizationId)) });
    if (!found) throw new NotFoundException("Organization member not found");
    return found;
  }
}
