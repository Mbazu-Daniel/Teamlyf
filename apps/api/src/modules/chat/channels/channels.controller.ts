import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../../common/better-auth/session.guard";
import type { SessionMember } from "../../../common/types";
import { CurrentMember, OrgMemberGuard, PermissionsGuard, RequirePermission } from "../../rbac";
import { ChannelMembersService } from "./channel-members.service";
import { ChannelMessagesService } from "./channel-messages.service";
import { ChannelsService } from "./channels.service";
import type { AddChannelMembersDto } from "./dto/add-channel-members.dto";
import type { ChannelMessagesQueryDto } from "./dto/channel-messages-query.dto";
import type { ChannelSearchQueryDto } from "./dto/channel-search-query.dto";
import type { CreateChannelDto } from "./dto/create-channel.dto";

/**
 * Channels slice of chat. The integrator registers this controller with
 * `ChannelsService`, `ChannelMembersService` and `ChannelMessagesService`;
 * message writes live in `ChannelMessageWriterService`, which the realtime
 * gateway injects (and `realtime.module.ts` already provides).
 */
@ApiTags("Chat")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/channels")
export class ChannelsController {
  constructor(
    private readonly channels: ChannelsService,
    private readonly members: ChannelMembersService,
    private readonly messages: ChannelMessagesService,
  ) {}

  @Get()
  @RequirePermission("chat", "read")
  @ApiOperation({ summary: "Every channel in the workspace, with the caller's unread flags" })
  @ApiParam({ name: "orgId" })
  list(@Param("orgId") orgId: string, @CurrentMember() member: SessionMember) {
    return this.channels.list(orgId, member.id);
  }

  @Post()
  @RequirePermission("chat", "create")
  @ApiOperation({ summary: "Create a channel and join its creator" })
  @ApiParam({ name: "orgId" })
  create(
    @Param("orgId") orgId: string,
    @CurrentMember() member: SessionMember,
    @Body() dto: CreateChannelDto,
  ) {
    return this.channels.create(orgId, member.id, dto);
  }

  @Get(":channelId/messages/search")
  @RequirePermission("chat", "read")
  @ApiOperation({ summary: "Search a channel's messages" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "channelId" })
  searchMessages(
    @Param("orgId") orgId: string,
    @Param("channelId") channelId: string,
    @Query() query: ChannelSearchQueryDto,
    @CurrentMember() member: SessionMember,
  ) {
    return this.messages.search(orgId, member.id, channelId, query);
  }

  @Get(":channelId/messages/threads/:parentMessageId")
  @RequirePermission("chat", "read")
  @ApiOperation({ summary: "Replies of one channel thread, oldest first" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "channelId" })
  @ApiParam({ name: "parentMessageId" })
  getThreadMessages(
    @Param("orgId") orgId: string,
    @Param("channelId") channelId: string,
    @Param("parentMessageId") parentMessageId: string,
    @CurrentMember() member: SessionMember,
  ) {
    return this.messages.thread(orgId, member.id, channelId, parentMessageId);
  }

  @Get(":channelId/messages")
  @RequirePermission("chat", "read")
  @ApiOperation({ summary: "Cursor-paged root messages of a channel, newest page first" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "channelId" })
  getMessages(
    @Param("orgId") orgId: string,
    @Param("channelId") channelId: string,
    @Query() query: ChannelMessagesQueryDto,
    @CurrentMember() member: SessionMember,
  ) {
    return this.messages.list(orgId, member.id, channelId, query);
  }

  @Get(":channelId/members")
  @RequirePermission("chat", "read")
  @ApiOperation({ summary: "Members of a channel, oldest join first" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "channelId" })
  getMembers(
    @Param("orgId") orgId: string,
    @Param("channelId") channelId: string,
    @CurrentMember() member: SessionMember,
  ) {
    return this.members.getMembers(orgId, member.id, channelId);
  }

  @Get(":channelId")
  @RequirePermission("chat", "read")
  @ApiOperation({ summary: "One channel with the caller's unread flags" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "channelId" })
  getChannel(
    @Param("orgId") orgId: string,
    @Param("channelId") channelId: string,
    @CurrentMember() member: SessionMember,
  ) {
    return this.channels.getOne(orgId, member.id, channelId);
  }

  @Post(":channelId/join")
  @RequirePermission("chat", "create")
  @ApiOperation({ summary: "Join a channel, idempotently" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "channelId" })
  joinChannel(
    @Param("orgId") orgId: string,
    @Param("channelId") channelId: string,
    @CurrentMember() member: SessionMember,
  ) {
    return this.members.join(orgId, member.id, channelId);
  }

  @Post(":channelId/members")
  @RequirePermission("chat", "create")
  @ApiOperation({ summary: "Add workspace members to a channel" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "channelId" })
  addMembers(
    @Param("orgId") orgId: string,
    @Param("channelId") channelId: string,
    @CurrentMember() member: SessionMember,
    @Body() dto: AddChannelMembersDto,
  ) {
    return this.members.addMembers(orgId, member.id, channelId, dto.tenantMemberIds);
  }

  @Post(":channelId/read")
  @RequirePermission("chat", "update")
  @ApiOperation({ summary: "Mark the channel read up to now" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "channelId" })
  async markChannelAsRead(
    @Param("orgId") orgId: string,
    @Param("channelId") channelId: string,
    @CurrentMember() member: SessionMember,
  ) {
    await this.members.markRead(orgId, member.id, channelId);
    return { success: true };
  }

  @Post(":channelId/leave")
  @RequirePermission("chat", "update")
  @ApiOperation({ summary: "Leave a channel" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "channelId" })
  async leaveChannel(
    @Param("orgId") orgId: string,
    @Param("channelId") channelId: string,
    @CurrentMember() member: SessionMember,
  ) {
    await this.members.leave(orgId, member.id, channelId);
    return { message: "Successfully left the channel" };
  }

  @Delete(":channelId")
  @RequirePermission("chat", "delete")
  @ApiOperation({ summary: "Delete a channel (owner only)" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "channelId" })
  deleteChannel(
    @Param("orgId") orgId: string,
    @Param("channelId") channelId: string,
    @CurrentMember() member: SessionMember,
  ) {
    return this.channels.remove(orgId, member.id, channelId);
  }
}
