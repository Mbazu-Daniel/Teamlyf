import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { SessionMember } from "../../common/types";
import type { MemberRequest } from "./org-member.guard";

export const CurrentMember = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionMember => {
    const req = ctx.switchToHttp().getRequest<MemberRequest>();
    return req.member;
  },
);
