import { Controller, Post, Get, Body, Req, Res } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import type { Request, Response as ExpressResponse } from "express";
import {
  forwardSetCookies,
  readResponseBody,
  toFetchHeaders,
} from "../../common/better-auth/better-auth-http";
import { AuthService } from "./auth.service";
import { SignUpDto, SignInDto } from "./dto";

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
  @ApiOperation({ summary: "List all sessions" })
  @ApiResponse({ status: 200, description: "Sessions returned" })
  async getSessions(@Req() req: Request) {
    const headers = toFetchHeaders(req);
    const response = await this.authService.getSessions(headers);

    return readResponseBody(response);
  }
}
