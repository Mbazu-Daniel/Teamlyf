import { Body, Controller, Get, Param, Patch, Post, Query, Req, Res, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { Request, Response as ExpressResponse } from "express";
import { proxyBetterAuth } from "../../common/better-auth/better-auth-proxy";
import { SessionGuard } from "../../common/better-auth/session.guard";
import type { SessionMember } from "../../common/types";
import { CurrentMember, OrgMemberGuard } from "../rbac";
import { MemberService } from "./member.service";
import {
  GetActiveMemberRoleQueryDto,
  LeaveOrganizationDto,
  ListMembersQueryDto,
  RemoveMemberDto,
  UpdateMemberProfileDto,
  UpdateMemberRoleDto,
} from "./dto";

@ApiTags("Organization Members")
@Controller("organization/:orgId/members")
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Get()
  @ApiOperation({ summary: "List members of an organization" })
  @ApiParam({ name: "orgId", description: "Organization ID" })
  @ApiResponse({ status: 200, description: "Members returned" })
  @ApiResponse({ status: 400, description: "No active organization" })
  @ApiResponse({ status: 403, description: "Not a member of this organization" })
  async getMembers(
    @Param("orgId") orgId: string,
    @Query() query: ListMembersQueryDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    return proxyBetterAuth(req, res, (headers) =>
      this.memberService.getMembers(orgId, query, headers),
    );
  }

  @Post("remove")
  @ApiOperation({ summary: "Remove a member from an organization" })
  @ApiParam({ name: "orgId", description: "Organization ID" })
  @ApiResponse({ status: 200, description: "Member removed" })
  @ApiResponse({ status: 400, description: "Member not found" })
  @ApiResponse({ status: 403, description: "Not allowed to remove this member" })
  async deleteMember(
    @Param("orgId") orgId: string,
    @Body() body: RemoveMemberDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    return proxyBetterAuth(req, res, (headers) =>
      this.memberService.deleteMember(orgId, body, headers),
    );
  }

  @Post("update-role")
  @ApiOperation({ summary: "Update the role of a member in an organization" })
  @ApiParam({ name: "orgId", description: "Organization ID" })
  @ApiResponse({ status: 200, description: "Member role updated" })
  @ApiResponse({ status: 400, description: "Member not found" })
  @ApiResponse({ status: 403, description: "Not allowed to update this member" })
  async updateMemberRole(
    @Param("orgId") orgId: string,
    @Body() body: UpdateMemberRoleDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    return proxyBetterAuth(req, res, (headers) =>
      this.memberService.updateMemberRole(orgId, body, headers),
    );
  }

  @Patch("profile")
  @UseGuards(SessionGuard, OrgMemberGuard)
  @ApiOperation({ summary: "Update the current member's profile name" })
  @ApiParam({ name: "orgId", description: "Organization ID" })
  @ApiResponse({ status: 200, description: "Member name updated" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  @ApiResponse({ status: 403, description: "Not a member of this organization" })
  async updateMemberProfile(
    @Param("orgId") orgId: string,
    @CurrentMember() current: SessionMember,
    @Body() body: UpdateMemberProfileDto,
  ) {
    return this.memberService.updateProfile(orgId, current.id, body);
  }

  @Get("active")
  @ApiOperation({ summary: "Get the current member of the active organization" })
  @ApiParam({ name: "orgId", description: "Organization ID" })
  @ApiResponse({ status: 200, description: "Member returned" })
  @ApiResponse({ status: 400, description: "No active organization or member not found" })
  async getActiveMember(
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    return proxyBetterAuth(req, res, (headers) =>
      this.memberService.getActiveMember(headers),
    );
  }

  @Get("active-role")
  @ApiOperation({ summary: "Get the current member role in an organization" })
  @ApiParam({ name: "orgId", description: "Organization ID" })
  @ApiResponse({ status: 200, description: "Member role returned" })
  @ApiResponse({ status: 400, description: "No active organization" })
  async getActiveMemberRole(
    @Param("orgId") orgId: string,
    @Query() query: GetActiveMemberRoleQueryDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    return proxyBetterAuth(req, res, (headers) =>
      this.memberService.getActiveMemberRole(orgId, query, headers),
    );
  }

  @Post("leave")
  @ApiOperation({ summary: "Leave an organization" })
  @ApiParam({ name: "orgId", description: "Organization ID" })
  @ApiResponse({ status: 200, description: "Left the organization" })
  @ApiResponse({ status: 400, description: "Member not found or only owner" })
  async leaveOrganization(
    @Param("orgId") orgId: string,
    @Body() body: LeaveOrganizationDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    return proxyBetterAuth(req, res, (headers) =>
      this.memberService.leaveOrganization(orgId, body, headers),
    );
  }
}
