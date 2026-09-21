import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { member, organization } from "@teamlyf/db/organization-schema";
import { eq } from "drizzle-orm";
import type { Request } from "express";
import { SessionGuard, type AuthedRequest } from "../../common/better-auth/session.guard";
import { Inject } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { DATABASE } from "../../common/db/db.provider";

/** Lists organizations the signed-in user can actually enter. */
@ApiTags("Workspace")
@ApiBearerAuth()
@UseGuards(SessionGuard)
@Controller("workspaces")
export class WorkspaceController {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  @Get()
  async list(@Req() req: Request) {
    const userId = (req as AuthedRequest).user.id;
    const rows = await this.db
      .select({ organization, membership: member })
      .from(member)
      .innerJoin(organization, eq(member.organizationId, organization.id))
      .where(eq(member.userId, userId));

    return rows.map(({ organization: workspace, membership }) => ({
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      logo: workspace.logo,
      plan: workspace.plan,
      role: membership.role,
      memberId: membership.id,
    }));
  }
}
