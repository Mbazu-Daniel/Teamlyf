import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../common/better-auth/session.guard";
import type { SessionMember } from "../../common/types";
import { CurrentMember, OrgMemberGuard, PermissionsGuard, RequirePermission } from "../rbac";
import { ChatService } from "./chat.service";
import { AddMembersDto, CreateChannelDto, CreateMessageDto, ReactionDto, UpdateMessageDto } from "./chat.dto";

@ApiTags("Chat")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/channels")
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get()
  @RequirePermission("chat", "read")
  getChannels(@Param("orgId") orgId: string, @CurrentMember() member: SessionMember) {
    return this.chat.getChannels(orgId, member.id);
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

  @Get(":channelId")
  @RequirePermission("chat", "read")
  @ApiOperation({ summary: "Get a channel" })
  getChannel(@Param("orgId") orgId: string, @Param("channelId") channelId: string, @CurrentMember() member: SessionMember) {
    return this.chat.getChannel(orgId, channelId, member.id);
  }

  @Get(":channelId/members")
  @RequirePermission("chat", "read")
  @ApiOperation({ summary: "List a channel's members" })
  members(@Param("orgId") orgId: string, @Param("channelId") channelId: string, @CurrentMember() member: SessionMember) {
    return this.chat.listMembers(orgId, channelId, member.id);
  }

  @Post(":channelId/members")
  @RequirePermission("chat", "update")
  @ApiOperation({ summary: "Add members to a channel" })
  addMembers(@Param("orgId") orgId: string, @Param("channelId") channelId: string, @CurrentMember() member: SessionMember, @Body() body: AddMembersDto) {
    return this.chat.addMembers(orgId, channelId, member.id, body.memberIds);
  }

  @Post(":channelId/read")
  @RequirePermission("chat", "read")
  @ApiOperation({ summary: "Mark a channel as read up to now" })
  markRead(@Param("orgId") orgId: string, @Param("channelId") channelId: string, @CurrentMember() member: SessionMember) {
    return this.chat.markRead(orgId, channelId, member.id);
  }

  @Delete(":channelId")
  @RequirePermission("chat", "delete")
  @ApiOperation({ summary: "Delete a channel" })
  deleteChannel(@Param("orgId") orgId: string, @Param("channelId") channelId: string, @CurrentMember() member: SessionMember) {
    return this.chat.deleteChannel(orgId, channelId, member.id);
  }

  @Get(":channelId/messages")
  @RequirePermission("chat", "read")
  history(@Param("orgId") orgId: string, @Param("channelId") channelId: string, @CurrentMember() member: SessionMember) {
    return this.chat.history(orgId, channelId, member.id);
  }

  @Get(":channelId/messages/search")
  @RequirePermission("chat", "read")
  @ApiOperation({ summary: "Search a channel's messages" })
  search(@Param("orgId") orgId: string, @Param("channelId") channelId: string, @CurrentMember() member: SessionMember, @Query("q") q = "") {
    return this.chat.searchMessages(orgId, channelId, member.id, q);
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

  @Delete(":channelId/messages/:messageId/reactions")
  @RequirePermission("chat", "read")
  @ApiOperation({ summary: "Remove your own reaction from a message" })
  removeReaction(@Param("orgId") orgId: string, @Param("channelId") channelId: string, @Param("messageId") messageId: string, @CurrentMember() member: SessionMember, @Query("emoji") emoji = "") {
    return this.chat.removeReaction(orgId, channelId, messageId, member.id, emoji);
  }

  @Patch(":channelId/messages/:messageId")
  @RequirePermission("chat", "update")
  @ApiOperation({ summary: "Edit your own message" })
  editMessage(@Param("orgId") orgId: string, @Param("channelId") channelId: string, @Param("messageId") messageId: string, @CurrentMember() member: SessionMember, @Body() body: UpdateMessageDto) {
    return this.chat.editMessage(orgId, channelId, messageId, member.id, body.content);
  }

  @Delete(":channelId/messages/:messageId")
  @RequirePermission("chat", "delete")
  @ApiOperation({ summary: "Delete your own message" })
  deleteMessage(@Param("orgId") orgId: string, @Param("channelId") channelId: string, @Param("messageId") messageId: string, @CurrentMember() member: SessionMember) {
    return this.chat.deleteMessage(orgId, channelId, messageId, member.id);
  }
}