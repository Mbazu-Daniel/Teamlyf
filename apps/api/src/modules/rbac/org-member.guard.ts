import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { AuthedRequest } from "../../common/better-auth/session.guard";
import type { SessionMember } from "../../common/types";
import { OrganizationAccessService } from "../organization/organization-access.service";

export type MemberRequest = AuthedRequest & { member: SessionMember };

@Injectable()
export class OrgMemberGuard implements CanActivate {
  constructor(private readonly organizationAccess: OrganizationAccessService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<MemberRequest>();
    if (!req.user?.id) {
      throw new UnauthorizedException("Authentication required");
    }

    const organizationIdParam = req.params.organizationId ?? req.params.orgId;
    const organizationId = Array.isArray(organizationIdParam)
      ? organizationIdParam[0]
      : organizationIdParam;

    if (!organizationId) {
      throw new ForbiddenException("Organization id required");
    }

    req.member = await this.organizationAccess.requireMember(
      req.user.id,
      organizationId,
    );

    return true;
  }
}
