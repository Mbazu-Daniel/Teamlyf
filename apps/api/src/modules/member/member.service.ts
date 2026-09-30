import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { member } from "@teamlyf/db";
import type { Database } from "@teamlyf/db";
import { user } from "@teamlyf/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { DATABASE } from "../../common/db/db.provider";
import { requireOrganizationMemberOrNotFound } from "../../common/organization-member";
import { AuthService } from "../auth/auth.service";
import type {
  GetActiveMemberRoleQueryDto,
  LeaveOrganizationDto,
  GetMembersQueryDto,
  RemoveMemberDto,
  UpdateMemberProfileDto,
  UpdateMemberRoleDto,
} from "./dto";

@Injectable()
export class MemberService {
  constructor(
    private readonly authService: AuthService,
    @Inject(DATABASE) private readonly db: Database,
  ) {}

  async getMembers(orgId: string, query: GetMembersQueryDto, headers: Headers) {
    return this.authService.auth.api.listMembers({
      query: { ...query, organizationId: orgId },
      headers,
      asResponse: true,
    });
  }

  async deleteMember(orgId: string, body: RemoveMemberDto, headers: Headers) {
    return this.authService.auth.api.removeMember({
      body: { ...body, organizationId: orgId },
      headers,
      asResponse: true,
    });
  }

  async updateMemberRole(orgId: string, body: UpdateMemberRoleDto, headers: Headers) {
    return this.authService.auth.api.updateMemberRole({
      body: { ...body, organizationId: orgId },
      headers,
      asResponse: true,
    });
  }

  async getActiveMember(headers: Headers) {
    return this.authService.auth.api.getActiveMember({
      headers,
      asResponse: true,
    });
  }

  async getActiveMemberRole(orgId: string, query: GetActiveMemberRoleQueryDto, headers: Headers) {
    return this.authService.auth.api.getActiveMemberRole({
      query: { ...query, organizationId: orgId },
      headers,
      asResponse: true,
    });
  }

  async leaveOrganization(orgId: string, body: LeaveOrganizationDto, headers: Headers) {
    return this.authService.auth.api.leaveOrganization({
      body: { ...body, organizationId: orgId },
      headers,
      asResponse: true,
    });
  }

  private async applyProfile(orgId: string, memberId: string, body: UpdateMemberProfileDto) {
    const values: Partial<typeof member.$inferInsert> = { updatedAt: new Date() };
    if (body.firstName !== undefined) values.firstName = body.firstName;
    if (body.lastName !== undefined) values.lastName = body.lastName;
    if (body.avatar !== undefined) values.avatar = body.avatar;

    const [updated] = await this.db
      .update(member)
      .set(values)
      .where(and(eq(member.id, memberId), eq(member.organizationId, orgId)))
      .returning();

    if (!updated) {
      throw new NotFoundException("Member not found");
    }

    return updated;
  }

  async updateProfile(orgId: string, memberId: string, body: UpdateMemberProfileDto) {
    const { id, firstName, lastName, avatar } = await this.applyProfile(orgId, memberId, body);
    return { id, firstName, lastName, avatar };
  }

  /**
   * better-auth's `listMembers` knows nothing about our `member.avatar` column,
   * so overlay it from the membership rows before the payload reaches the client.
   */
  async withMemberAvatars(orgId: string, body: unknown): Promise<unknown> {
    const members = (body as { members?: Record<string, unknown> } | null)?.members;
    if (!Array.isArray(members) || members.length === 0) return body;

    const ids = members
      .map((row) => row.id)
      .filter((id): id is string => typeof id === "string");
    if (ids.length === 0) return body;

    const rows = await this.db.query.member.findMany({
      where: and(eq(member.organizationId, orgId), inArray(member.id, ids)),
      columns: { id: true, avatar: true },
    });
    const avatars = new Map(rows.map((row) => [row.id, row.avatar]));

    return {
      ...(body as Record<string, unknown>),
      members: members.map((row) => ({
        ...row,
        avatar: typeof row.id === "string" ? (avatars.get(row.id) ?? null) : null,
      })),
    };
  }

  async getMember(orgId: string, memberId: string) {
    const memberRow = await requireOrganizationMemberOrNotFound(this.db, orgId, memberId);
    const userRow = memberRow.userId
      ? await this.db.query.user.findFirst({
          where: eq(user.id, memberRow.userId),
          columns: { id: true, email: true, name: true },
        })
      : null;
    return { ...memberRow, user: userRow ?? null };
  }

  async updateMember(orgId: string, memberId: string, body: UpdateMemberProfileDto) {
    return this.applyProfile(orgId, memberId, body);
  }
}
