import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { member } from "@teamlyf/db";
import type { Database } from "@teamlyf/db";
import { user } from "@teamlyf/db/schema";
import { and, eq } from "drizzle-orm";
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

  /**
   * The one write behind both profile routes. PATCH /profile (the caller's own
   * row) and PATCH /:memberId (an admin's pick) set the same two columns and
   * miss the same way, so they share this and differ only in what they return.
   */
  private async applyProfile(orgId: string, memberId: string, body: UpdateMemberProfileDto) {
    const [updated] = await this.db
      .update(member)
      .set({ firstName: body.firstName, lastName: body.lastName, updatedAt: new Date() })
      .where(and(eq(member.id, memberId), eq(member.organizationId, orgId)))
      .returning();

    if (!updated) {
      throw new NotFoundException("Member not found");
    }

    return updated;
  }

  async updateProfile(orgId: string, memberId: string, body: UpdateMemberProfileDto) {
    const { id, firstName, lastName } = await this.applyProfile(orgId, memberId, body);
    return { id, firstName, lastName };
  }

  /** Member detail: the membership row plus the linked auth account. */
  async getMember(orgId: string, memberId: string) {
    const memberRow = await requireOrganizationMemberOrNotFound(this.db, orgId, memberId);
    const userRow = memberRow.userId
      ? await this.db.query.user.findFirst({
          where: eq(user.id, memberRow.userId),
          columns: { id: true, email: true, name: true, image: true },
        })
      : null;
    return { ...memberRow, user: userRow ?? null };
  }

  async updateMember(orgId: string, memberId: string, body: UpdateMemberProfileDto) {
    return this.applyProfile(orgId, memberId, body);
  }
}
