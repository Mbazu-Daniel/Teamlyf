import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Database } from "@teamlyf/db";
import { permissionGrant } from "@teamlyf/db/organization-schema";
import { and, eq, isNull, or } from "drizzle-orm";
import { toFetchHeaders } from "../../common/better-auth/better-auth-http";
import { DATABASE } from "../../common/db/db.provider";
import { AuthService } from "../auth/auth.service";
import type { MemberRequest } from "./org-member.guard";
import {
  REQUIRE_PERMISSION_KEY,
  type RequirePermissionMeta,
} from "./require-permission.decorator";

/**
 * Two-step check:
 * 1. better-auth hasPermission (role-level, user subjects)
 * 2. permission_grant fallback for resourceId overrides or agent subjects
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
    @Inject(DATABASE) private readonly db: Database,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const meta = this.reflector.getAllAndOverride<RequirePermissionMeta | undefined>(
      REQUIRE_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!meta) return true;

    const req = context.switchToHttp().getRequest<MemberRequest>();
    if (!req.user?.id) throw new UnauthorizedException("Authentication required");

    const orgIdParam = req.params.orgId;
    const orgId = Array.isArray(orgIdParam) ? orgIdParam[0] : orgIdParam;
    if (!orgId) throw new ForbiddenException("Organization id required");

    const resourceIdRaw = meta.resourceIdParam
      ? req.params[meta.resourceIdParam]
      : undefined;
    const resourceId = Array.isArray(resourceIdRaw) ? resourceIdRaw[0] : resourceIdRaw;

    const allowed = await this.checkUserPermission(
      req,
      orgId,
      meta.resource,
      meta.action,
      resourceId,
    );
    if (!allowed) {
      throw new ForbiddenException("Missing permission");
    }
    return true;
  }

  /** Public for agent workers later — agents skip better-auth entirely. */
  async checkAgentPermission(
    orgId: string,
    agentId: string,
    resource: string,
    action: string,
    resourceId?: string,
  ): Promise<boolean> {
    return this.hasGrant({
      orgId,
      subjectKind: "agent",
      subjectId: agentId,
      resource,
      action,
      resourceId,
    });
  }

  private async checkUserPermission(
    req: MemberRequest,
    orgId: string,
    resource: string,
    action: string,
    resourceId?: string,
  ): Promise<boolean> {
    const result = await this.authService.auth.api
      .hasPermission({
        headers: toFetchHeaders(req),
        body: {
          organizationId: orgId,
          permissions: { [resource]: [action] },
        },
      })
      .catch(() => null);

    if (result?.success) return true;

    return this.hasGrant({
      orgId,
      subjectKind: "user",
      subjectId: req.user.id,
      resource,
      action,
      resourceId,
    });
  }

  private async hasGrant(input: {
    orgId: string;
    subjectKind: "user" | "agent";
    subjectId: string;
    resource: string;
    action: string;
    resourceId?: string;
  }): Promise<boolean> {
    const rows = await this.db.query.permissionGrant.findMany({
      where: and(
        eq(permissionGrant.organizationId, input.orgId),
        eq(permissionGrant.subjectKind, input.subjectKind),
        eq(permissionGrant.subjectId, input.subjectId),
        eq(permissionGrant.module, input.resource),
        eq(permissionGrant.action, input.action),
        input.resourceId
          ? or(eq(permissionGrant.resourceId, input.resourceId), isNull(permissionGrant.resourceId))
          : isNull(permissionGrant.resourceId),
      ),
      limit: 1,
    });
    return rows.length > 0;
  }
}
