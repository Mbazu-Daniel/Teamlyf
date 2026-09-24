import { Injectable } from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import type { CreateOrganizationDto, UpdateOrganizationDto } from "./dto";

@Injectable()
export class OrganizationService {
  constructor(private readonly authService: AuthService) {}

  async createOrganization(body: CreateOrganizationDto, headers: Headers) {
    return this.authService.auth.api.createOrganization({
      body: {
        name: body.name,
        slug: body.slug,
        logo: body.logo ?? null,
      },
      headers,
      asResponse: true,
    });
  }

  async listOrganizations(headers: Headers) {
    return this.authService.auth.api.listOrganizations({
      headers,
      asResponse: true,
    });
  }

  async getOrganization(orgId: string, headers: Headers) {
    return this.authService.auth.api.getOrganization({
      query: { organizationId: orgId },
      headers,
      asResponse: true,
    });
  }

  async updateOrganization(orgId: string, body: UpdateOrganizationDto, headers: Headers) {
    return this.authService.auth.api.updateOrganization({
      body: {
        data: {
          name: body.name,
          logo: body.logo,
        },
        organizationId: orgId,
      },
      headers,
      asResponse: true,
    });
  }

  async deleteOrganization(orgId: string, headers: Headers) {
    return this.authService.auth.api.deleteOrganization({
      body: { organizationId: orgId },
      headers,
      asResponse: true,
    });
  }
}
