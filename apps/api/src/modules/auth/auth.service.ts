import { Inject, Injectable } from "@nestjs/common";
import { createDb } from "@teamlyf/db";
import { createAuth, type Auth } from "../../common/config/better-auth.config";
import { API_ENV } from "../../common/config/env.module";
import type { ApiEnv } from "../../common/config/env";
import type { SignUpDto } from "./dto/sign-up.dto";
import type { SignInDto } from "./dto/sign-in.dto";
import type { SignInSocialDto } from "./dto/sign-in-social.dto";
import type { UpdateUserDto } from "./dto/update-user.dto";
import type { RevokeSessionDto } from "./dto/revoke-session.dto";
import type { ChangePasswordDto } from "./dto/change-password.dto";
import type { ForgotPasswordDto } from "./dto/forgot-password.dto";
import type { ResetPasswordDto } from "./dto/reset-password.dto";
import type { RefreshTokenDto } from "./dto/refresh-token.dto";

@Injectable()
export class AuthService {
  readonly auth: Auth;

  constructor(@Inject(API_ENV) env: ApiEnv) {
    const { db } = createDb(env.DATABASE_URL);

    this.auth = createAuth({
      db,
      secret: env.BETTER_AUTH_SECRET,
      // Origin only — a path in baseURL takes precedence over basePath
      // (better-auth docs), which would move the HTTP routes off
      // /api/v1/auth/* and 404 every middleware route (social sign-in,
      // update-user, OAuth callback). The /api/v1 prefix lives in basePath.
      baseURL: env.BETTER_AUTH_URL,
      webOrigin: env.WEB_ORIGIN,
      google:
        env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
          ? { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }
          : undefined,
    });
  }

  async signUpEmail(body: SignUpDto, headers: Headers) {
    const localPart = body.email.split("@")[0];
    const name =
      body.name || localPart.replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    return this.auth.api.signUpEmail({
      body: {
        name,
        email: body.email,
        password: body.password,
        image: body.image,
        callbackURL: body.callbackURL,
      },
      headers,
      asResponse: true,
    });
  }

  async signInEmail(body: SignInDto, headers: Headers) {
    return this.auth.api.signInEmail({
      body: {
        email: body.email,
        password: body.password,
        callbackURL: body.callbackURL,
        rememberMe: body.rememberMe ?? true,
      },
      headers,
      asResponse: true,
    });
  }

  async getSession(headers: Headers) {
    return this.auth.api.getSession({
      headers,
      query: {},
      asResponse: true,
    });
  }

  /**
   * Starts the provider handshake. Returns the provider consent URL and sets
   * better-auth's short-lived state cookie; the browser follows the URL and
   * Google returns to GET /auth/callback/:provider, which the AuthMiddleware
   * hands to better-auth raw because it has to issue a redirect.
   */
  async signInSocial(body: SignInSocialDto, headers: Headers) {
    return this.auth.api.signInSocial({
      body: {
        provider: body.provider,
        callbackURL: body.callbackURL,
        newUserCallbackURL: body.newUserCallbackURL,
        errorCallbackURL: body.errorCallbackURL,
      },
      headers,
      asResponse: true,
    });
  }

  async updateUser(body: UpdateUserDto, headers: Headers) {
    return this.auth.api.updateUser({
      body: { name: body.name, image: body.image },
      headers,
      asResponse: true,
    });
  }

  async revokeSession(body: RevokeSessionDto, headers: Headers) {
    return this.auth.api.revokeSession({
      body: { token: body.token },
      headers,
      asResponse: true,
    });
  }

  /** Signs out every other device, keeping the caller's session alive. */
  async revokeOtherSessions(headers: Headers) {
    return this.auth.api.revokeOtherSessions({
      headers,
      asResponse: true,
    });
  }

  async signOut(headers: Headers) {
    return this.auth.api.signOut({
      headers,
      asResponse: true,
    });
  }

  async getSessions(headers: Headers) {
    return this.auth.api.listSessions({
      headers,
      asResponse: true,
    });
  }

  async changePassword(body: ChangePasswordDto, headers: Headers) {
    return this.auth.api.changePassword({
      body,
      headers,
      asResponse: true,
    });
  }

  async forgotPassword(body: ForgotPasswordDto, headers: Headers) {
    return this.auth.api.requestPasswordReset({
      body,
      headers,
      asResponse: true,
    });
  }

  async resetPassword(body: ResetPasswordDto, headers: Headers) {
    return this.auth.api.resetPassword({
      body,
      headers,
      asResponse: true,
    });
  }

  async refreshToken(body: RefreshTokenDto, headers: Headers) {
    return this.auth.api.refreshToken({
      body: body.accountId
        ? { accountId: body.accountId, userId: body.userId }
        : { useAccountCookie: true, userId: body.userId },
      headers,
      asResponse: true,
    });
  }
}
