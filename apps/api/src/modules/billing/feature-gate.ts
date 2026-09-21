import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, SetMetadata } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Database } from "@teamlyf/db";
import { organization } from "@teamlyf/db/organization-schema";
import { eq } from "drizzle-orm";
import { DATABASE } from "../../common/db/db.provider";

const REQUIRED_FEATURE = "required_feature";
export type Feature = "agents" | "calls";
const planFeatures: Record<string, readonly Feature[]> = { starter: [], growth: ["agents"], scale: ["agents", "calls"] };
export const RequireFeature = (feature: Feature) => SetMetadata(REQUIRED_FEATURE, feature);

@Injectable()
export class FeatureGateGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, @Inject(DATABASE) private readonly db: Database) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.getAllAndOverride<Feature | undefined>(REQUIRED_FEATURE, [context.getHandler(), context.getClass()]);
    if (!feature) return true;
    const orgId = context.switchToHttp().getRequest<{ params: { orgId?: string } }>().params.orgId;
    const org = orgId ? await this.db.query.organization.findFirst({ where: eq(organization.id, orgId) }) : undefined;
    if (!org || !planFeatures[org.plan]?.includes(feature)) throw new ForbiddenException(`${feature} requires a higher plan`);
    return true;
  }
}
