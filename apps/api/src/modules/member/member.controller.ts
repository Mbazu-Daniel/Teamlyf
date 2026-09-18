import { Body, Controller, Get, Param, Post, Query, Req, Res } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { Request, Response as ExpressResponse } from "express";
import { proxyBetterAuth } from "../../common/better-auth/better-auth-proxy";
import { MemberService } from "./member.service";
import {
  GetActiveMemberRoleQueryDto,
  LeaveOrganizationDto,
  ListMembersQueryDto,
  RemoveMemberDto,
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
  async listMembers(
    @Param("orgId") orgId: string,
    @Query() query: ListMembersQueryDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    return proxyBetterAuth(req, res, (headers) =>
      this.memberService.listMembers(orgId, query, headers),
    );
  }

  @Post("remove")
  @ApiOperation({ summary: "Remove a member from an organization" })
  @ApiParam({ name: "orgId", description: "Organization ID" })
  @ApiResponse({ status: 200, description: "Member removed" })
  @ApiResponse({ status: 400, description: "Member not found" })
  @ApiResponse({ status: 403, description: "Not allowed to remove this member" })
  async removeMember(
    @Param("orgId") orgId: string,
    @Body() body: RemoveMemberDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    return proxyBetterAuth(req, res, (headers) =>
      this.memberService.removeMember(orgId, body, headers),
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
