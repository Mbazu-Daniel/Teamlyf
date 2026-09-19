import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "../../modules/auth/auth.service";
import type { SessionUser } from "../types/session-user.type";
import { toFetchHeaders } from "./better-auth-http";

export type AuthedRequest = Request & { user: SessionUser };

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const session = await this.authService.auth.api.getSession({
      headers: toFetchHeaders(req),
    });

    if (!session?.user) {
      throw new UnauthorizedException("Authentication required");
    }

    req.user = session.user as SessionUser;
    return true;
  }
}
