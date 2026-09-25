import { Controller, Post, Get, Body, Req, Res } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import type { Request, Response as ExpressResponse } from "express";
import {
  forwardSetCookies,
  readResponseBody,
  toFetchHeaders,
} from "../../common/better-auth/better-auth-http";
import { AuthService } from "./auth.service";
import { SignUpDto, SignInDto, SignInSocialDto, UpdateUserDto, RevokeSessionDto, ChangePasswordDto, ForgotPasswordDto, ResetPasswordDto, RefreshTokenDto } from "./dto";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("sign-up/email")
  @ApiOperation({ summary: "Register a new user" })
  @ApiResponse({ status: 201, description: "User created successfully" })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 409, description: "User already exists" })
  async signUp(
    @Body() body: SignUpDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    const headers = toFetchHeaders(req);
    const response = await this.authService.signUpEmail(body, headers);

    forwardSetCookies(res, response);
    // Forward better-auth's status (201 on success, 400/409 on failure).
    // Without this Nest defaults POST to 201 and failures look like successes.
    res.status(response.status);
    return readResponseBody(response);
  }

  @Post("sign-in/email")
  @ApiOperation({ summary: "Sign in with email and password" })
  @ApiResponse({ status: 200, description: "Signed in successfully" })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async signIn(
    @Body() body: SignInDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    const headers = toFetchHeaders(req);
    const response = await this.authService.signInEmail(body, headers);

    forwardSetCookies(res, response);
    // Forward better-auth's status (200 on success, 401 on bad credentials).
    // Without this Nest defaults POST to 201 and a bad password looks like a success.
    res.status(response.status);
    return readResponseBody(response);
  }

  @Get("session")
  @ApiOperation({ summary: "Get current session" })
  @ApiResponse({ status: 200, description: "Session returned" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  async getSession(@Req() req: Request, @Res({ passthrough: true }) res: ExpressResponse) {
    const headers = toFetchHeaders(req);
    const response = await this.authService.getSession(headers);

    forwardSetCookies(res, response);
    return readResponseBody(response);
  }

  @Post("sign-in/social")
  @ApiOperation({
    summary: "Start OAuth sign-in",
    description:
      "Returns the provider consent URL to send the browser to. 404 when the " +
      "provider has no credentials configured. Google returns to " +
      "GET /auth/callback/{provider}, which better-auth answers directly.",
  })
  @ApiResponse({ status: 200, description: "Consent URL returned" })
  @ApiResponse({ status: 404, description: "Provider not configured" })
  async signInSocial(
    @Body() body: SignInSocialDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    const headers = toFetchHeaders(req);
    const response = await this.authService.signInSocial(body, headers);

    // Carries better-auth's short-lived state cookie the callback validates.
    forwardSetCookies(res, response);
    res.status(response.status);
    return readResponseBody(response);
  }

  @Post("update-user")
  @ApiOperation({ summary: "Update the current user's profile" })
  @ApiResponse({ status: 200, description: "Profile updated" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  async updateUser(
    @Body() body: UpdateUserDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    const headers = toFetchHeaders(req);
    const response = await this.authService.updateUser(body, headers);

    forwardSetCookies(res, response);
    res.status(response.status);
    return readResponseBody(response);
  }

  @Post("sessions/revoke")
  @ApiOperation({ summary: "Revoke one session, signing out that device" })
  @ApiResponse({ status: 200, description: "Session revoked" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  async revokeSession(
    @Body() body: RevokeSessionDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    const headers = toFetchHeaders(req);
    const response = await this.authService.revokeSession(body, headers);

    forwardSetCookies(res, response);
    res.status(response.status);
    return readResponseBody(response);
  }

  @Post("sessions/revoke-others")
  @ApiOperation({ summary: "Revoke every other session, keeping the current one" })
  @ApiResponse({ status: 200, description: "Other sessions revoked" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  async revokeOtherSessions(@Req() req: Request, @Res({ passthrough: true }) res: ExpressResponse) {
    const headers = toFetchHeaders(req);
    const response = await this.authService.revokeOtherSessions(headers);

    forwardSetCookies(res, response);
    res.status(response.status);
    return readResponseBody(response);
  }

  @Post("sign-out")
  @ApiOperation({ summary: "Sign out" })
  @ApiResponse({ status: 200, description: "Signed out" })
  async signOut(@Req() req: Request, @Res({ passthrough: true }) res: ExpressResponse) {
    const headers = toFetchHeaders(req);
    const response = await this.authService.signOut(headers);

    forwardSetCookies(res, response);
    return readResponseBody(response);
  }

  @Get("sessions")
  @ApiOperation({ summary: "Get all sessions for the current user" })
  @ApiResponse({ status: 200, description: "Sessions returned" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  async getSessions(@Req() req: Request, @Res({ passthrough: true }) res: ExpressResponse) {
    const headers = toFetchHeaders(req);
    const response = await this.authService.getSessions(headers);

    // better-auth may rotate the session cookie while authenticating, so this
    // endpoint has to pass Set-Cookie through like every other auth call.
    forwardSetCookies(res, response);
    res.status(response.status);
    return readResponseBody(response);
  }

  @Post("change-password")
  @ApiOperation({ summary: "Change the current user's password" })
  @ApiResponse({ status: 200, description: "Password changed" })
  @ApiResponse({ status: 401, description: "Not authenticated or wrong current password" })
  async changePassword(
    @Body() body: ChangePasswordDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    const headers = toFetchHeaders(req);
    const response = await this.authService.changePassword(body, headers);

    forwardSetCookies(res, response);
    res.status(response.status);
    return readResponseBody(response);
  }

  @Post("forgot-password")
  @ApiOperation({ summary: "Request a password-reset email" })
  @ApiResponse({ status: 200, description: "Reset email sent" })
  async forgotPassword(
    @Body() body: ForgotPasswordDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    const headers = toFetchHeaders(req);
    const response = await this.authService.forgotPassword(body, headers);

    forwardSetCookies(res, response);
    res.status(response.status);
    return readResponseBody(response);
  }

  @Post("reset-password")
  @ApiOperation({ summary: "Reset a password with the emailed token" })
  @ApiResponse({ status: 200, description: "Password reset" })
  @ApiResponse({ status: 400, description: "Invalid or expired token" })
  async resetPassword(
    @Body() body: ResetPasswordDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    const headers = toFetchHeaders(req);
    const response = await this.authService.resetPassword(body, headers);

    forwardSetCookies(res, response);
    res.status(response.status);
    return readResponseBody(response);
  }

  @Post("refresh-token")
  @ApiOperation({ summary: "Refresh an account token" })
  @ApiResponse({ status: 200, description: "Token refreshed" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  async refreshToken(
    @Body() body: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    const headers = toFetchHeaders(req);
    const response = await this.authService.refreshToken(body, headers);

    forwardSetCookies(res, response);
    res.status(response.status);
    return readResponseBody(response);
  }
}
