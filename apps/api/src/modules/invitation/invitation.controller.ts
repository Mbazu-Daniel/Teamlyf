import { Body, Controller, Get, Param, Post, Query, Req, Res } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { Request, Response as ExpressResponse } from "express";
import { proxyBetterAuth } from "../../common/better-auth/better-auth-proxy";
import { InvitationService } from "./invitation.service";
import {
  InvitationIdDto,
  InviteMemberDto,
  GetInvitationsQueryDto,
  GetUserInvitationsQueryDto,
} from "./dto";

@ApiTags("Organization Invitations")
@Controller("organization/:orgId/invitations")
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  private invitationById(
    req: Request,
    res: ExpressResponse,
    body: InvitationIdDto,
    action: "acceptInvitation" | "rejectInvitation" | "cancelInvitation",
  ) {
    return proxyBetterAuth(req, res, (headers) =>
      this.invitationService[action](body, headers),
    );
  }

  @Post()
  @ApiOperation({ summary: "Invite a user to an organization" })
  @ApiParam({ name: "orgId", description: "Organization ID" })
  @ApiResponse({ status: 200, description: "Invitation created" })
  @ApiResponse({ status: 400, description: "Already a member or already invited" })
  @ApiResponse({ status: 403, description: "Not allowed to invite" })
  async inviteMember(
    @Param("orgId") orgId: string,
    @Body() body: InviteMemberDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    return proxyBetterAuth(req, res, (headers) =>
      this.invitationService.inviteMember(orgId, body, headers),
    );
  }

  @Post("accept")
  @ApiOperation({ summary: "Accept an invitation to an organization" })
  @ApiParam({ name: "orgId", description: "Organization ID" })
  @ApiResponse({ status: 200, description: "Invitation accepted" })
  @ApiResponse({ status: 400, description: "Invitation not found or expired" })
  @ApiResponse({ status: 403, description: "Not the recipient of this invitation" })
  async acceptInvitation(
    @Body() body: InvitationIdDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    return this.invitationById(req, res, body, "acceptInvitation");
  }

  @Post("reject")
  @ApiOperation({ summary: "Reject an invitation to an organization" })
  @ApiParam({ name: "orgId", description: "Organization ID" })
  @ApiResponse({ status: 200, description: "Invitation rejected" })
  @ApiResponse({ status: 400, description: "Invitation not found or expired" })
  @ApiResponse({ status: 403, description: "Not the recipient of this invitation" })
  async rejectInvitation(
    @Body() body: InvitationIdDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    return this.invitationById(req, res, body, "rejectInvitation");
  }

  @Post("cancel")
  @ApiOperation({ summary: "Cancel an outstanding invitation" })
  @ApiParam({ name: "orgId", description: "Organization ID" })
  @ApiResponse({ status: 200, description: "Invitation cancelled" })
  @ApiResponse({ status: 400, description: "Invitation not found" })
  @ApiResponse({ status: 403, description: "Not allowed to cancel this invitation" })
  async cancelInvitation(
    @Body() body: InvitationIdDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    return this.invitationById(req, res, body, "cancelInvitation");
  }

  @Get("user")
  @ApiOperation({ summary: "Get the invitations the current user has received" })
  @ApiParam({ name: "orgId", description: "Organization ID" })
  @ApiResponse({ status: 200, description: "Invitations returned" })
  @ApiResponse({ status: 400, description: "Missing session headers" })
  async getUserInvitations(
    @Query() query: GetUserInvitationsQueryDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    return proxyBetterAuth(req, res, (headers) =>
      this.invitationService.getUserInvitations(query, headers),
    );
  }

  @Get(":invitationId")
  @ApiOperation({ summary: "Get an invitation by ID" })
  @ApiParam({ name: "orgId", description: "Organization ID" })
  @ApiParam({ name: "invitationId", description: "Invitation ID" })
  @ApiResponse({ status: 200, description: "Invitation returned" })
  @ApiResponse({ status: 400, description: "Invitation not found or expired" })
  @ApiResponse({ status: 403, description: "Not the recipient of this invitation" })
  async getInvitation(
    @Param("invitationId") invitationId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    return proxyBetterAuth(req, res, (headers) =>
      this.invitationService.getInvitation({ id: invitationId }, headers),
    );
  }

  @Get()
  @ApiOperation({ summary: "Get invitations of an organization" })
  @ApiParam({ name: "orgId", description: "Organization ID" })
  @ApiResponse({ status: 200, description: "Invitations returned" })
  @ApiResponse({ status: 400, description: "Organization ID is required" })
  @ApiResponse({ status: 403, description: "Not a member of this organization" })
  async getInvitations(
    @Param("orgId") orgId: string,
    @Query() query: GetInvitationsQueryDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    return proxyBetterAuth(req, res, (headers) =>
      this.invitationService.getInvitations(orgId, query, headers),
    );
  }
}
