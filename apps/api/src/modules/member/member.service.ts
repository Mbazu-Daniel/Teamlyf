import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { member } from "@teamlyf/db";
import type { Database } from "@teamlyf/db";
import { and, eq } from "drizzle-orm";
import { DATABASE } from "../../common/db/db.provider";
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

  async updateProfile(orgId: string, memberId: string, body: UpdateMemberProfileDto) {
    const [updated] = await this.db
      .update(member)
      .set({ firstName: body.firstName, lastName: body.lastName, updatedAt: new Date() })
      .where(and(eq(member.id, memberId), eq(member.organizationId, orgId)))
      .returning({ id: member.id, firstName: member.firstName, lastName: member.lastName });

    if (!updated) {
      throw new NotFoundException("Member not found");
    }

    return updated;
  }
}
