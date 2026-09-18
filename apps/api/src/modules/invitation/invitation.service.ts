import { Injectable } from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import type {
  GetInvitationQueryDto,
  InvitationIdDto,
  InviteMemberDto,
  ListInvitationsQueryDto,
  ListUserInvitationsQueryDto,
} from "./dto";

@Injectable()
export class InvitationService {
  constructor(private readonly authService: AuthService) {}

  async inviteMember(orgId: string, body: InviteMemberDto, headers: Headers) {
    return this.authService.auth.api.createInvitation({
      body: { ...body, organizationId: orgId },
      headers,
      asResponse: true,
    });
  }

  async acceptInvitation(body: InvitationIdDto, headers: Headers) {
    return this.authService.auth.api.acceptInvitation({
      body,
      headers,
      asResponse: true,
    });
  }

  async rejectInvitation(body: InvitationIdDto, headers: Headers) {
    return this.authService.auth.api.rejectInvitation({
      body,
      headers,
      asResponse: true,
    });
  }

  async cancelInvitation(body: InvitationIdDto, headers: Headers) {
    return this.authService.auth.api.cancelInvitation({
      body,
      headers,
      asResponse: true,
    });
  }

  async getInvitation(query: GetInvitationQueryDto, headers: Headers) {
    return this.authService.auth.api.getInvitation({
      query,
      headers,
      asResponse: true,
    });
  }

  async listInvitations(orgId: string, query: ListInvitationsQueryDto, headers: Headers) {
    return this.authService.auth.api.listInvitations({
      query: { ...query, organizationId: orgId },
      headers,
      asResponse: true,
    });
  }

  async listUserInvitations(query: ListUserInvitationsQueryDto, headers: Headers) {
    return this.authService.auth.api.listUserInvitations({
      query,
      headers,
      asResponse: true,
    });
  }
}
