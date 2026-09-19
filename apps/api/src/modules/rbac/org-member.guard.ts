import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Inject } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { member } from "@teamlyf/db/organization-schema";
import { and, eq } from "drizzle-orm";
import type { AuthedRequest } from "../../common/better-auth/session.guard";
import { DATABASE } from "../../common/db/db.provider";
import type { SessionMember } from "../../common/types";

export type MemberRequest = AuthedRequest & { member: SessionMember };

@Injectable()
export class OrgMemberGuard implements CanActivate {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<MemberRequest>();
    if (!req.user?.id) {
      throw new UnauthorizedException("Authentication required");
    }

    const orgIdParam = req.params.orgId;
    const orgId = Array.isArray(orgIdParam) ? orgIdParam[0] : orgIdParam;
    if (!orgId) {
      throw new ForbiddenException("Organization id required");
    }

    const found = await this.db.query.member.findFirst({
      where: and(eq(member.organizationId, orgId), eq(member.userId, req.user.id)),
    });
    if (!found) {
      throw new ForbiddenException("Not a member of this organization");
    }

    req.member = {
      id: found.id,
      organizationId: found.organizationId,
      userId: found.userId,
      role: found.role,
      createdAt: found.createdAt,
    };
    return true;
  }
}
