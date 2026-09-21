import { Injectable } from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import type { CreateOrganizationDto, UpdateOrganizationDto } from "./dto";
import { OrganizationAccessService } from "./organization-access.service";

@Injectable()
export class OrganizationService {
  constructor(
    private readonly authService: AuthService,
    private readonly accessService: OrganizationAccessService,
  ) {}

  async listOrganizations(userId: string) {
    return this.accessService.listForUser(userId);
  }

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

  async getOrganization(organizationId: string, headers: Headers) {
    return this.authService.auth.api.getOrganization({
      query: { organizationId },
      headers,
      asResponse: true,
    });
  }

  async updateOrganization(
    organizationId: string,
    body: UpdateOrganizationDto,
    headers: Headers,
  ) {
    return this.authService.auth.api.updateOrganization({
      body: {
        data: {
          name: body.name,
          logo: body.logo,
        },
        organizationId,
      },
      headers,
      asResponse: true,
    });
  }

  async deleteOrganization(organizationId: string, headers: Headers) {
    return this.authService.auth.api.deleteOrganization({
      body: { organizationId },
      headers,
      asResponse: true,
    });
  }
}
