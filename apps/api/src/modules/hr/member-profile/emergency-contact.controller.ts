import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { toFetchHeaders } from "../../../common/better-auth/better-auth-http";
import { SessionGuard } from "../../../common/better-auth/session.guard";
import type { SessionMember } from "../../../common/types";
import { CurrentMember, OrgMemberGuard } from "../../rbac";
import { OrganizationPermissionService } from "../../rbac/organization-permission.service";
import { UpdateEmergencyContactDto } from "./dto";
import { MemberProfileService } from "./member-profile.service";

/**
 * Self-service with an admin escape hatch (mirrors the reference API's `me` alias):
 * members read/update their own emergency contact; holders of the `hr` permission
 * can read/update anyone's.
 */
@ApiTags("HR emergency contacts")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard)
@Controller("organization/:orgId/members/:memberId/emergency-contact")
export class EmergencyContactController {
  constructor(
    private readonly profiles: MemberProfileService,
    private readonly permissions: OrganizationPermissionService,
  ) {}

  @Get()
  @ApiOperation({ summary: "Get a member's emergency contact (own, or any with hr:read)" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "memberId", description: "Member id, or 'me' for the current member" })
  async getEmergencyContact(
    @Param("orgId") orgId: string,
    @Param("memberId") memberId: string,
    @CurrentMember() current: SessionMember,
    @Req() req: Request,
  ) {
    const target = await this.resolveTarget(orgId, current, memberId, req, "read");
    return this.profiles.getEmergencyContact(orgId, target);
  }

  @Patch()
  @ApiOperation({ summary: "Update a member's emergency contact (own, or any with hr:update)" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "memberId", description: "Member id, or 'me' for the current member" })
  async updateEmergencyContact(
    @Param("orgId") orgId: string,
    @Param("memberId") memberId: string,
    @CurrentMember() current: SessionMember,
    @Req() req: Request,
    @Body() body: UpdateEmergencyContactDto,
  ) {
    const target = await this.resolveTarget(orgId, current, memberId, req, "update");
    return this.profiles.updateEmergencyContact(orgId, target, body);
  }

  /** Resolves the `me` alias and enforces self-or-`hr` access. */
  private async resolveTarget(
    orgId: string,
    current: SessionMember,
    memberId: string,
    req: Request,
    action: "read" | "update",
  ) {
    const target = memberId === "me" ? current.id : memberId;
    if (target === current.id) return target;

    const allowed = await this.permissions.checkUserPermission(
      current.userId,
      toFetchHeaders(req),
      orgId,
      "hr",
      action,
    );
    if (!allowed) throw new ForbiddenException("You can only access your own emergency contact");
    return target;
  }
}
