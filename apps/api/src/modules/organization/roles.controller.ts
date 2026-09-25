import { Body, Controller, Delete, Get, Param, Patch, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { Request, Response as ExpressResponse } from "express";
import { SessionGuard } from "../../common/better-auth/session.guard";
import { permissionCatalog } from "../../common/better-auth/permissions";
import { proxyBetterAuth } from "../../common/better-auth/better-auth-proxy";
// Direct file imports (not the ../rbac barrel) — the barrel pulls in RbacModule,
// which imports OrganizationModule, and that cycle would break Nest's bootstrap.
import { OrgMemberGuard } from "../rbac/org-member.guard";
import { PermissionsGuard } from "../rbac/permissions.guard";
import { RequirePermission } from "../rbac/require-permission.decorator";
import { CreateRoleDto, UpdateRoleDto } from "./dto";
import { RolesService } from "./roles.service";

@ApiTags("Organization Roles")
@ApiBearerAuth()
@UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard)
@Controller("organization/:orgId/roles")
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  /** Static route must be declared before the ":role" param route. */
  @Get("permissions")
  @RequirePermission("ac", "read")
  @ApiOperation({ summary: "Permission catalog: resources → allowed actions" })
  @ApiParam({ name: "orgId" })
  getPermissions() {
    return permissionCatalog;
  }

  @Get()
  @RequirePermission("ac", "read")
  @ApiOperation({ summary: "List organization roles (built-in and dynamic)" })
  @ApiParam({ name: "orgId" })
  listRoles(
    @Param("orgId") orgId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    return proxyBetterAuth(req, res, (headers) => this.rolesService.listRoles(orgId, headers));
  }

  @Post()
  @RequirePermission("ac", "create")
  @ApiOperation({ summary: "Create a dynamic role" })
  @ApiParam({ name: "orgId" })
  @ApiResponse({ status: 201, description: "Role created" })
  @ApiResponse({ status: 400, description: "Invalid permission map or role name taken" })
  createRole(
    @Param("orgId") orgId: string,
    @Body() body: CreateRoleDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    return proxyBetterAuth(req, res, (headers) => this.rolesService.createRole(orgId, body, headers));
  }

  @Get(":role")
  @RequirePermission("ac", "read")
  @ApiOperation({ summary: "Get a role by name" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "role", description: "Role name" })
  getRole(
    @Param("orgId") orgId: string,
    @Param("role") role: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    return proxyBetterAuth(req, res, (headers) => this.rolesService.getRole(orgId, role, headers));
  }

  @Patch(":role")
  @RequirePermission("ac", "update")
  @ApiOperation({ summary: "Update a role's permissions or rename it" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "role", description: "Role name" })
  updateRole(
    @Param("orgId") orgId: string,
    @Param("role") role: string,
    @Body() body: UpdateRoleDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    return proxyBetterAuth(req, res, (headers) =>
      this.rolesService.updateRole(orgId, role, body, headers),
    );
  }

  @Delete(":role")
  @RequirePermission("ac", "delete")
  @ApiOperation({ summary: "Delete a dynamic role" })
  @ApiParam({ name: "orgId" })
  @ApiParam({ name: "role", description: "Role name" })
  deleteRole(
    @Param("orgId") orgId: string,
    @Param("role") role: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    return proxyBetterAuth(req, res, (headers) => this.rolesService.deleteRole(orgId, role, headers));
  }
}
