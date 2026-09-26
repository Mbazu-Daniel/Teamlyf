import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { member, projectMember } from "@teamlyf/db";
import type { Database } from "@teamlyf/db";
import { and, eq } from "drizzle-orm";
import { DATABASE } from "../../../common/db/db.provider";
import { ProjectAccessService } from "../project-access.service";

@Injectable()
export class ProjectMemberService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly access: ProjectAccessService,
  ) {}

  async getMembers(orgId: string, projectId: string) {
    await this.access.requireProject(orgId, projectId);
    return this.db.query.projectMember.findMany({
      where: and(eq(projectMember.organizationId, orgId), eq(projectMember.projectId, projectId)),
      with: { member: true },
      orderBy: (row, { asc }) => [asc(row.createdAt)],
    });
  }

  async addMembers(orgId: string, projectId: string, memberIds: string[]) {
    await this.access.requireProject(orgId, projectId);

    const organizationMembers = await this.db.query.member.findMany({
      where: and(eq(member.organizationId, orgId)),
      columns: { id: true },
    });
    const allowed = new Set(organizationMembers.map((row) => row.id));
    const requested = [...new Set(memberIds)];

    if (requested.some((memberId) => !allowed.has(memberId))) {
      throw new BadRequestException("All project members must belong to the organization");
    }

    const existing = await this.db.query.projectMember.findMany({
      where: and(eq(projectMember.organizationId, orgId), eq(projectMember.projectId, projectId)),
      columns: { memberId: true },
    });
    const existingIds = new Set(existing.map((row) => row.memberId));
    const newIds = requested.filter((memberId) => !existingIds.has(memberId));

    if (newIds.length > 0) {
      await this.db.insert(projectMember).values(
        newIds.map((memberId) => ({
          projectId,
          organizationId: orgId,
          memberId,
          role: "member",
        })),
      );
    }

    return this.getMembers(orgId, projectId);
  }

  async removeMember(orgId: string, projectId: string, memberId: string) {
    await this.access.requireProject(orgId, projectId);

    const [removed] = await this.db
      .delete(projectMember)
      .where(
        and(
          eq(projectMember.organizationId, orgId),
          eq(projectMember.projectId, projectId),
          eq(projectMember.memberId, memberId),
        ),
      )
      .returning();

    if (!removed) {
      throw new NotFoundException("Member is not part of this project");
    }

    return { success: true };
  }
}
