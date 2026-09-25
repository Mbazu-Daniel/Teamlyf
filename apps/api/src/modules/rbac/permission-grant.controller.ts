import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../common/better-auth/session.guard";
import { OrgMemberGuard } from "./org-member.guard";
import { PermissionsGuard } from "./permissions.guard";
import { RequirePermission } from "./require-permission.decorator";
import { PermissionGrantService } from "./permission-grant.service";
import { CreatePermissionGrantDto, GetPermissionGrantsQueryDto } from "./dto";

@ApiTags("Permission grants")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/permission-grants")
export class PermissionGrantController {
  constructor(private readonly grants: PermissionGrantService) {}

  @Get()
  @RequirePermission("ac", "read")
  @ApiOperation({ summary: "List permission grants (filter by subject)" })
  @ApiParam({ name: "orgId" })
  getPermissionGrants(@Param("orgId") orgId: string, @Query() query: GetPermissionGrantsQueryDto) {
    return this.grants.getPermissionGrants(orgId, query);
  }

  @Post()
  @RequirePermission("ac", "create")
  @ApiOperation({ summary: "Grant a module action to a user or agent" })
  @ApiParam({ name: "orgId" })
  @ApiResponse({ status: 201, description: "Grant created" })
  @ApiResponse({ status: 400, description: "Unknown permission or subject not in organization" })
  createPermissionGrant(@Param("orgId") orgId: string, @Body() body: CreatePermissionGrantDto) {
    return this.grants.createPermissionGrant(orgId, body);
  }

  @Delete(":grantId")
  @RequirePermission("ac", "delete")
  @ApiOperation({ summary: "Revoke a permission grant" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "grantId" })
  deletePermissionGrant(@Param("orgId") orgId: string, @Param("grantId") grantId: string) {
    return this.grants.deletePermissionGrant(orgId, grantId);
  }
}
