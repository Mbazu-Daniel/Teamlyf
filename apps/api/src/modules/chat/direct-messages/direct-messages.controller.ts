import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../../common/better-auth/session.guard";
import type { SessionMember } from "../../../common/types";
import { CurrentMember, OrgMemberGuard, PermissionsGuard, RequirePermission } from "../../rbac";
import { DirectMessagesConversationsService } from "./direct-messages-conversations.service";
import { DirectMessagesHistoryService } from "./direct-messages-history.service";
import { DirectMessagesThreadsService } from "./direct-messages-threads.service";
import { DirectMessagesService } from "./direct-messages.service";
import { CreateDirectMessageDto } from "./dto/create-direct-message.dto";
import { DirectMessagesQueryDto } from "./dto/direct-messages-query.dto";

@ApiTags("Chat")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/dm")
export class DirectMessagesController {
  constructor(
    private readonly conversations: DirectMessagesConversationsService,
    private readonly history: DirectMessagesHistoryService,
    private readonly threads: DirectMessagesThreadsService,
    private readonly messages: DirectMessagesService,
  ) {}

  @Get("conversations")
  @RequirePermission("chat", "read")
  @ApiOperation({ summary: "One direct message preview per partner, newest activity first" })
  @ApiParam({ name: "orgId" })
  listConversations(@Param("orgId") orgId: string, @CurrentMember() member: SessionMember) {
    return this.conversations.getConversations(orgId, member.id);
  }

  @Get("conversations/:chatId")
  @RequirePermission("chat", "read")
  @ApiOperation({ summary: "Cursor page of the message history with one partner" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "chatId", description: "The partner's member id" })
  getMessages(
    @Param("orgId") orgId: string,
    @Param("chatId") chatId: string,
    @CurrentMember() member: SessionMember,
    @Query() query: DirectMessagesQueryDto,
  ) {
    return this.history.getConversationHistory(orgId, member.id, chatId, query);
  }

  @Get("conversations/:chatId/threads/:parentId")
  @RequirePermission("chat", "read")
  @ApiOperation({ summary: "Thread replies for one message in a conversation" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "chatId", description: "The partner's member id" })
  @ApiParam({ name: "parentId", description: "The root message id" })
  getThreadReplies(
    @Param("orgId") orgId: string,
    @Param("chatId") chatId: string,
    @Param("parentId") parentId: string,
    @CurrentMember() member: SessionMember,
  ) {
    return this.threads.getThreadReplies(orgId, member.id, chatId, parentId);
  }

  @Post("conversations/:chatId/read")
  @RequirePermission("chat", "update")
  @ApiOperation({ summary: "Mark every message from this partner as read" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "chatId", description: "The partner's member id" })
  markConversationAsRead(
    @Param("orgId") orgId: string,
    @Param("chatId") chatId: string,
    @CurrentMember() member: SessionMember,
  ) {
    return this.messages.markConversationAsRead(orgId, member.id, chatId);
  }

  @Post()
  @RequirePermission("chat", "create")
  @ApiOperation({ summary: "Start (or continue) a conversation with a workspace member" })
  @ApiParam({ name: "orgId" })
  async send(
    @Param("orgId") orgId: string,
    @CurrentMember() member: SessionMember,
    @Body() dto: CreateDirectMessageDto,
  ) {
    const message = await this.messages.createDirectMessage({
      organizationId: orgId,
      senderId: member.id,
      recipientId: dto.recipientId,
      content: dto.content,
      parentMessageId: dto.parentMessageId,
      attachmentIds: dto.attachmentIds,
    });
    return { message };
  }
}
