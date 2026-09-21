import { ForbiddenException, NotFoundException } from "@nestjs/common";

/**
 * Base guard for every tenant-owned resource. Feature repositories call this
 * before mutations and use the resulting organization id in every query.
 */
export abstract class TenantScopedRepository {
  protected assertOrganizationId(organizationId: string): string {
    if (!organizationId) throw new ForbiddenException("Organization id required");
    return organizationId;
  }

  protected requireScoped<T>(record: T | undefined, label = "Resource"): T {
    if (!record) throw new NotFoundException(`${label} not found`);
    return record;
  }
}
