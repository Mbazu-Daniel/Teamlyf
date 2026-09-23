import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../common/better-auth/session.guard";
import type { SessionMember } from "../../common/types";
import { CurrentMember, OrgMemberGuard, PermissionsGuard, RequirePermission } from "../rbac";
import { ChatService } from "./chat.service";
import { CreateChannelDto, CreateMessageDto, ReactionDto } from "./chat.dto";

@ApiTags("Chat")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/channels")
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get()
  @RequirePermission("chat", "read")
  list(@Param("orgId") orgId: string, @CurrentMember() member: SessionMember) {
    return this.chat.listChannels(orgId, member.id);
  }

  @Post()
  @RequirePermission("chat", "create")
  create(@Param("orgId") orgId: string, @CurrentMember() member: SessionMember, @Body() body: CreateChannelDto) {
    return this.chat.createChannel(orgId, member.id, body);
  }

  @Post(":channelId/join")
  @RequirePermission("chat", "read")
  join(@Param("orgId") orgId: string, @Param("channelId") channelId: string, @CurrentMember() member: SessionMember) {
    return this.chat.join(orgId, channelId, member.id);
  }

  @Delete(":channelId/leave")
  @RequirePermission("chat", "read")
  leave(@Param("orgId") orgId: string, @Param("channelId") channelId: string, @CurrentMember() member: SessionMember) {
    return this.chat.leave(orgId, channelId, member.id);
  }

  @Get(":channelId/messages")
  @RequirePermission("chat", "read")
  history(@Param("orgId") orgId: string, @Param("channelId") channelId: string, @CurrentMember() member: SessionMember) {
    return this.chat.history(orgId, channelId, member.id);
  }

  @Get(":channelId/messages/:messageId/thread")
  @RequirePermission("chat", "read")
  thread(@Param("orgId") orgId: string, @Param("channelId") channelId: string, @Param("messageId") messageId: string, @CurrentMember() member: SessionMember, @Query("cursor") cursor?: string) {
    return this.chat.thread(orgId, channelId, messageId, member.id, cursor);
  }

  @Post(":channelId/messages")
  @RequirePermission("chat", "create")
  post(@Param("orgId") orgId: string, @Param("channelId") channelId: string, @CurrentMember() member: SessionMember, @Body() body: CreateMessageDto) {
    return this.chat.post(orgId, channelId, member.id, body);
  }

  @Post(":channelId/messages/:messageId/reactions")
  @RequirePermission("chat", "create")
  reaction(@Param("orgId") orgId: string, @Param("channelId") channelId: string, @Param("messageId") messageId: string, @CurrentMember() member: SessionMember, @Body() body: ReactionDto) {
    return this.chat.addReaction(orgId, channelId, messageId, member.id, body.emoji);
  }
}