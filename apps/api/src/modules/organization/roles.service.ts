import { BadRequestException, Injectable } from "@nestjs/common";
import { permissionCatalog } from "../../common/better-auth/permissions";
import { AuthService } from "../auth/auth.service";
import type { CreateRoleDto, UpdateRoleDto } from "./dto";

/**
 * Proxies better-auth's dynamic access-control endpoints
 * (`/organization/create-role`, `list-roles`, `get-role`, `update-role`, `delete-role`).
 * better-auth enforces session + `ac` permissions internally on every call.
 */
@Injectable()
export class RolesService {
  constructor(private readonly authService: AuthService) {}

  async listRoles(orgId: string, headers: Headers) {
    return this.authService.auth.api.listOrgRoles({
      query: { organizationId: orgId },
      headers,
      asResponse: true,
    });
  }

  async createRole(orgId: string, dto: CreateRoleDto, headers: Headers) {
    this.assertPermissionMap(dto.permission);
    return this.authService.auth.api.createOrgRole({
      body: {
        organizationId: orgId,
        role: dto.role,
        permission: dto.permission,
      },
      headers,
      asResponse: true,
    });
  }

  async getRole(orgId: string, role: string, headers: Headers) {
    return this.authService.auth.api.getOrgRole({
      query: { organizationId: orgId, roleName: role },
      headers,
      asResponse: true,
    });
  }

  async updateRole(orgId: string, role: string, dto: UpdateRoleDto, headers: Headers) {
    if (dto.permission) this.assertPermissionMap(dto.permission);
    return this.authService.auth.api.updateOrgRole({
      body: {
        organizationId: orgId,
        roleName: role,
        data: {
          permission: dto.permission,
          roleName: dto.roleName,
        },
      },
      headers,
      asResponse: true,
    });
  }

  async deleteRole(orgId: string, role: string, headers: Headers) {
    return this.authService.auth.api.deleteOrgRole({
      body: { organizationId: orgId, roleName: role },
      headers,
      asResponse: true,
    });
  }

  /** Rejects unknown resources/actions before better-auth does, with a clearer message. */
  private assertPermissionMap(permission: Record<string, string[]>) {
    const catalog = permissionCatalog as Record<string, readonly string[]>;

    for (const [resource, actions] of Object.entries(permission)) {
      const allowed = catalog[resource];
      if (!allowed) {
        throw new BadRequestException(`Unknown permission resource "${resource}"`);
      }
      if (!Array.isArray(actions)) {
        throw new BadRequestException(`Actions for "${resource}" must be an array of strings`);
      }
      for (const action of actions) {
        if (!allowed.includes(action)) {
          throw new BadRequestException(`Unknown action "${action}" for resource "${resource}"`);
        }
      }
    }
  }
}
