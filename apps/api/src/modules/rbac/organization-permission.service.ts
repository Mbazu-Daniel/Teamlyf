import { Inject, Injectable } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { member, permissionGrant } from "@teamlyf/db/organization-schema";
import { and, eq, isNull, or } from "drizzle-orm";
import { toFetchHeaders } from "../../common/better-auth/better-auth-http";
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
    orgId: string,
    resource: string,
    action: string,
    resourceId?: string,
  ): Promise<boolean> {
    const isMember = await this.isOrganizationMember(orgId, userId);
    if (!isMember) return false;

    const result = await this.authService.auth.api
      .hasPermission({
        headers,
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
      subjectId: userId,
      resource,
      action,
      resourceId,
    });
  }

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

  private async isOrganizationMember(orgId: string, userId: string): Promise<boolean> {
    const found = await this.db.query.member.findFirst({
      where: and(eq(member.organizationId, orgId), eq(member.userId, userId)),
      columns: { id: true },
    });

    return Boolean(found);
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
          ? or(
              eq(permissionGrant.resourceId, input.resourceId),
              isNull(permissionGrant.resourceId),
            )
          : isNull(permissionGrant.resourceId),
      ),
      limit: 1,
    });

    return rows.length > 0;
  }
}
