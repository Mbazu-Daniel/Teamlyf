import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { organizationSchema } from "@teamlyf/db";
import { and, eq } from "drizzle-orm";
import { DATABASE } from "../../common/db/db.provider";
import { AuthService } from "../auth/auth.service";
import type {
  GetInvitationQueryDto,
  InvitationIdDto,
  InviteMemberDto,
  GetInvitationsQueryDto,
  GetUserInvitationsQueryDto,
} from "./dto";

const { invitation } = organizationSchema;

@Injectable()
export class InvitationService {
  constructor(
    private readonly authService: AuthService,
    @Inject(DATABASE) private readonly db: Database,
  ) {}

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

  async getInvitations(orgId: string, query: GetInvitationsQueryDto, headers: Headers) {
    return this.authService.auth.api.listInvitations({
      query: { ...query, organizationId: orgId },
      headers,
      asResponse: true,
    });
  }

  async getUserInvitations(query: GetUserInvitationsQueryDto, headers: Headers) {
    return this.authService.auth.api.listUserInvitations({
      query,
      headers,
      asResponse: true,
    });
  }

  /**
   * Re-invites a pending invitation through better-auth's native `resend`
   * flag (renews the invite and re-sends the email on the same row).
   */
  async resendInvitation(orgId: string, invitationId: string, headers: Headers) {
    const found = await this.db.query.invitation.findFirst({
      where: and(eq(invitation.id, invitationId), eq(invitation.organizationId, orgId)),
    });
    if (!found) throw new NotFoundException("Invitation not found");
    if (found.status !== "pending") {
      throw new BadRequestException("Invitation is no longer pending");
    }
    if (!found.role) throw new BadRequestException("Invitation has no role");
    return this.authService.auth.api.createInvitation({
      body: { email: found.email, role: found.role, organizationId: orgId, resend: true },
      headers,
      asResponse: true,
    });
  }
}
