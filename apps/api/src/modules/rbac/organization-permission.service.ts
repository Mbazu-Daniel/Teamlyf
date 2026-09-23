import { Inject, Injectable } from "@nestjs/common";
import { and, eq, isNull, or } from "drizzle-orm";
import type { Database } from "@teamlyf/db";
import { member, permissionGrant } from "@teamlyf/db/organization-schema";
import { DATABASE } from "../../common/db/db.provider";
import { AuthService } from "../auth/auth.service";

@Injectable()
export class OrganizationPermissionService {
  constructor(
    private readonly authService: AuthService,
    @Inject(DATABASE) private readonly db: Database,
  ) {}

  async checkUserPermission(
    userId: string,
    headers: Headers,
    organizationId: string,
    resource: string,
    action: string,
    resourceId?: string,
  ): Promise<boolean> {
    const membership = await this.db.query.member.findFirst({
      where: and(eq(member.organizationId, organizationId), eq(member.userId, userId)),
      columns: { id: true },
    });
    if (!membership) return false;

    const result = await this.authService.auth.api.hasPermission({
      headers,
      body: {
        organizationId,
        permissions: { [resource]: [action] },
      },
    }).catch(() => null);

    if (result?.success) return true;

    return this.hasGrant({
      organizationId,
      subjectKind: "user",
      subjectId: userId,
      resource,
      action,
      resourceId,
    });
  }

  async checkAgentPermission(
    organizationId: string,
    agentId: string,
    resource: string,
    action: string,
    resourceId?: string,
  ): Promise<boolean> {
    return this.hasGrant({
      organizationId,
      subjectKind: "agent",
      subjectId: agentId,
      resource,
      action,
      resourceId,
    });
  }

  private async hasGrant(input: {
    organizationId: string;
    subjectKind: "user" | "agent";
    subjectId: string;
    resource: string;
    action: string;
    resourceId?: string;
  }): Promise<boolean> {
    const rows = await this.db.query.permissionGrant.findMany({
      where: and(
        eq(permissionGrant.organizationId, input.organizationId),
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
