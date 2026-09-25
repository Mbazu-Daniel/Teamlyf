import { Body, Controller, Delete, Get, Param, Post, Patch, Req, Res } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { Request, Response as ExpressResponse } from "express";
import { proxyBetterAuth } from "../../common/better-auth/better-auth-proxy";
import { OrganizationService } from "./organization.service";
import { CreateOrganizationDto, UpdateOrganizationDto } from "./dto";

@ApiTags("Organization")
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

  // Static collection route must be declared before the ":orgId" param route.
  @Get()
  @ApiOperation({ summary: "Get the organizations the current user belongs to" })
  @ApiResponse({ status: 200, description: "Organizations returned" })
  @ApiResponse({ status: 401, description: "Not authenticated" })
  async getOrganizations(
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    return this.proxy(req, res, (h) => this.organizationService.getOrganizations(h));
  }

  @Get(":orgId")
  @ApiOperation({ summary: "Get an organization by ID" })
  @ApiParam({ name: "orgId", description: "Organization ID" })
  @ApiResponse({ status: 200, description: "Organization returned" })
  @ApiResponse({ status: 404, description: "Organization not found" })
  // fallow-ignore-next-line code-duplication
  async getOrganization(
    @Param("orgId") orgId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    return this.proxy(req, res, (h) => this.organizationService.getOrganization(orgId, h));
  }

  @Patch(":orgId")
  @ApiOperation({ summary: "Update an organization" })
  @ApiParam({ name: "orgId", description: "Organization ID" })
  @ApiResponse({ status: 200, description: "Organization updated" })
  @ApiResponse({ status: 400, description: "Validation error" })
  @ApiResponse({ status: 404, description: "Organization not found" })
  async updateOrganization(
    @Param("orgId") orgId: string,
    @Body() body: UpdateOrganizationDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    return this.proxy(req, res, (h) => this.organizationService.updateOrganization(orgId, body, h));
  }

  @Delete(":orgId")
  @ApiOperation({ summary: "Delete an organization" })
  @ApiParam({ name: "orgId", description: "Organization ID" })
  @ApiResponse({ status: 200, description: "Organization deleted" })
  @ApiResponse({ status: 404, description: "Organization not found" })
  async deleteOrganization(
    @Param("orgId") orgId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: ExpressResponse,
  ) {
    return this.proxy(req, res, (h) => this.organizationService.deleteOrganization(orgId, h));
  }
}
