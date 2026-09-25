import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { agent } from "@teamlyf/db";
import { member, permissionGrant } from "@teamlyf/db/organization-schema";
import { and, eq, isNull } from "drizzle-orm";
import { permissionCatalog } from "../../common/better-auth/permissions";
import { DATABASE } from "../../common/db/db.provider";
import type { CreatePermissionGrantDto, GetPermissionGrantsQueryDto } from "./dto";

/**
 * CRUD over `permission_grant` — the narrow grants better-auth's roles cannot express
 * (instance overrides for users, and all agent grants). Previously read-only.
 */
@Injectable()
export class PermissionGrantService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async getPermissionGrants(orgId: string, query: GetPermissionGrantsQueryDto) {
    const conditions = [eq(permissionGrant.organizationId, orgId)];
    if (query.subjectKind) conditions.push(eq(permissionGrant.subjectKind, query.subjectKind));
    if (query.subjectId) conditions.push(eq(permissionGrant.subjectId, query.subjectId));

    return this.db.query.permissionGrant.findMany({
      where: and(...conditions),
      orderBy: (g, { desc: d }) => [d(g.createdAt)],
    });
  }

  async createPermissionGrant(orgId: string, dto: CreatePermissionGrantDto) {
    this.assertPermission(dto.module, dto.action);
    await this.assertSubject(orgId, dto.subjectKind, dto.subjectId);

    const duplicate = await this.db.query.permissionGrant.findFirst({
      where: and(
        eq(permissionGrant.organizationId, orgId),
        eq(permissionGrant.subjectKind, dto.subjectKind),
        eq(permissionGrant.subjectId, dto.subjectId),
        eq(permissionGrant.module, dto.module),
        eq(permissionGrant.action, dto.action),
        dto.resourceId ? eq(permissionGrant.resourceId, dto.resourceId) : isNull(permissionGrant.resourceId),
      ),
      columns: { id: true },
    });
    if (duplicate) throw new BadRequestException("Permission grant already exists");

    const [created] = await this.db
      .insert(permissionGrant)
      .values({
        organizationId: orgId,
        subjectKind: dto.subjectKind,
        subjectId: dto.subjectId,
        module: dto.module,
        action: dto.action,
        resourceId: dto.resourceId ?? null,
      })
      .returning();
    return created;
  }

  async deletePermissionGrant(orgId: string, grantId: string) {
    const found = await this.db.query.permissionGrant.findFirst({
      where: and(eq(permissionGrant.organizationId, orgId), eq(permissionGrant.id, grantId)),
      columns: { id: true },
    });
    if (!found) throw new NotFoundException("Permission grant not found");

    await this.db.delete(permissionGrant).where(eq(permissionGrant.id, grantId));
  }

  /** The subject must exist inside this organization, or the grant would never match. */
  private async assertSubject(orgId: string, subjectKind: "user" | "agent", subjectId: string) {
    if (subjectKind === "user") {
      const found = await this.db.query.member.findFirst({
        where: and(eq(member.organizationId, orgId), eq(member.userId, subjectId)),
        columns: { id: true },
      });
      if (!found) throw new BadRequestException("User is not a member of this organization");
      return;
    }

    const found = await this.db.query.agent.findFirst({
      where: and(eq(agent.organizationId, orgId), eq(agent.id, subjectId)),
      columns: { id: true },
    });
    if (!found) throw new BadRequestException("Agent not found in this organization");
  }

  private assertPermission(module: string, action: string) {
    const catalog = permissionCatalog as Record<string, readonly string[]>;
    const allowed = catalog[module];
    if (!allowed) throw new BadRequestException(`Unknown permission module "${module}"`);
    if (!allowed.includes(action)) {
      throw new BadRequestException(`Unknown action "${action}" for module "${module}"`);
    }
  }
}
