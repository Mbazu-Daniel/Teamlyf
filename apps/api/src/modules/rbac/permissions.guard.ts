import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { MemberRequest } from "./org-member.guard";
import { toFetchHeaders } from "../../common/better-auth/better-auth-http";
import {
  REQUIRE_PERMISSION_KEY,
  type RequirePermissionMeta,
} from "./require-permission.decorator";
import { OrganizationPermissionService } from "./organization-permission.service";

/**
 * Organization-scoped permission enforcement for authenticated HTTP requests.
 *
 * User permissions are resolved from Better Auth role permissions with
 * organization-scoped grant fallback. Agent permissions are resolved by the
 * shared permission service and do not use Better Auth roles.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionService: OrganizationPermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const meta = this.getMetadata(context);
    if (!meta) return true;

    const req = context.switchToHttp().getRequest<MemberRequest>();
    const userId = this.requireUserId(req);
    const orgId = this.requireOrganizationId(req);
    const resourceId = this.getResourceId(req.params, meta.resourceIdParam);

    const allowed = await this.permissionService.checkUserPermission(
      userId,
      toFetchHeaders(req),
      orgId,
      meta.resource,
      meta.action,
      resourceId,
    );

    if (!allowed) throw new ForbiddenException("Missing permission");
    return true;
  }

  private getMetadata(context: ExecutionContext): RequirePermissionMeta | undefined {
    return this.reflector.getAllAndOverride<RequirePermissionMeta | undefined>(
      REQUIRE_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
  }

  private requireUserId(req: MemberRequest): string {
    if (!req.user?.id) throw new UnauthorizedException("Authentication required");
    return req.user.id;
  }

  private requireOrganizationId(req: MemberRequest): string {
    const orgId = this.getParamValue(req.params.orgId);
    if (!orgId) throw new ForbiddenException("Organization id required");
    return orgId;
  }

  private getResourceId(
    params: MemberRequest["params"],
    paramName?: string,
  ): string | undefined {
    if (!paramName) return undefined;
    return this.getParamValue(params[paramName]);
  }

  private getParamValue(value: string | string[] | undefined): string | undefined {
    return Array.isArray(value) ? value[0] : value;
  }
}
