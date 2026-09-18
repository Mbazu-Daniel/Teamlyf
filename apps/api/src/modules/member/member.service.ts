import { Injectable } from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import type {
  GetActiveMemberRoleQueryDto,
  LeaveOrganizationDto,
  ListMembersQueryDto,
  RemoveMemberDto,
  UpdateMemberRoleDto,
} from "./dto";

@Injectable()
export class MemberService {
  constructor(private readonly authService: AuthService) {}

  async listMembers(orgId: string, query: ListMembersQueryDto, headers: Headers) {
    return this.authService.auth.api.listMembers({
      query: { ...query, organizationId: orgId },
      headers,
      asResponse: true,
    });
  }

  async removeMember(orgId: string, body: RemoveMemberDto, headers: Headers) {
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
}
