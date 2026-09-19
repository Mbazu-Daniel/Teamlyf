import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { SessionUser } from "../types/session-user.type";
import type { AuthedRequest } from "./session.guard";

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionUser => {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    return req.user;
  },
);
