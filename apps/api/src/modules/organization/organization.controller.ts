import { Body, Controller, Delete, Get, Param, Patch, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { Request, Response as ExpressResponse } from "express";
import { proxyBetterAuth } from "../../common/better-auth/better-auth-proxy";
import { SessionGuard, type AuthedRequest } from "../../common/better-auth/session.guard";
import { CreateOrganizationDto, UpdateOrganizationDto } from "./dto";
import { OrganizationService } from "./organization.service";

@ApiTags("Organization")
@ApiBearerAuth()
@UseGuards(SessionGuard)
@Controller("organization")
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  private proxy(
    req: Request,
    res: ExpressResponse,
    respond: (headers: Headers) => Promise<globalThis.Response>,
  ) {
    return proxyBetterAuth(req, res, respond);
  }

  @Get()
  @ApiOperation({ summary: "List organizations available to the current user" })
  @ApiResponse({
    status: 200,
    description: "Organizations returned with the current member role and member ID",
  })
  async listOrganizations(@Req() req: Request) {
    return this.organizationService.listOrganizations((req as AuthedRequest).user.id);
  }

  @Post()
  @ApiOperation({ summary: "Create a new organization" })
  @ApiResponse({ status: 201, description: "Organization created" })
  @ApiResponse({ status: 400, description: "Validation error" })
  async createOrganization(
    @Body() body: CreateOrganizationDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    return this.proxy(req, res, (h) => this.organizationService.createOrganization(body, h));
  }

  @Get(":organizationId")
  @ApiOperation({ summary: "Get an organization by ID" })
  @ApiParam({ name: "organizationId", description: "Organization ID" })
  @ApiResponse({ status: 200, description: "Organization returned" })
  @ApiResponse({ status: 404, description: "Organization not found" })
  async getOrganization(
    @Param("organizationId") organizationId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    return this.proxy(req, res, (h) =>
      this.organizationService.getOrganization(organizationId, h),
    );
  }

  @Patch(":organizationId")
  @ApiOperation({ summary: "Update an organization" })
  @ApiParam({ name: "organizationId", description: "Organization ID" })
  @ApiResponse({ status: 200, description: "Organization updated" })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 404, description: "Organization not found" })
  async updateOrganization(
    @Param("organizationId") organizationId: string,
    @Body() body: UpdateOrganizationDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    return this.proxy(req, res, (h) =>
      this.organizationService.updateOrganization(organizationId, body, h),
    );
  }

  @Delete(":organizationId")
  @ApiOperation({ summary: "Delete an organization" })
  @ApiParam({ name: "organizationId", description: "Organization ID" })
  @ApiResponse({ status: 200, description: "Organization deleted" })
  @ApiResponse({ status: 404, description: "Organization not found" })
  async deleteOrganization(
    @Param("organizationId") organizationId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    return this.proxy(req, res, (h) =>
      this.organizationService.deleteOrganization(organizationId, h),
    );
  }
}
