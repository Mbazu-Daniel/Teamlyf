import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, SetMetadata } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Database } from "@teamlyf/db";
import { billingSchema } from "@teamlyf/db";

const { subscription } = billingSchema;
import { eq } from "drizzle-orm";
import { DATABASE } from "../../common/db/db.provider";

const REQUIRED_FEATURE = "required_feature";
export type Feature = "agents" | "calls";

export const RequireFeature = (feature: Feature) => SetMetadata(REQUIRED_FEATURE, feature);

@Injectable()
export class FeatureGateGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(DATABASE) private readonly db: Database,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.getAllAndOverride<Feature | undefined>(
      REQUIRED_FEATURE,
      [context.getHandler(), context.getClass()],
    );
    if (!feature) return true;

    const request = context.switchToHttp().getRequest<{ params: { orgId?: string } }>();
    const orgId = request.params.orgId;
    const current = orgId
      ? await this.db.query.subscription.findFirst({
          where: eq(subscription.organizationId, orgId),
        })
      : undefined;

    if (!current || current.status !== "active") {
      throw new ForbiddenException(`${feature} requires an active organization plan`);
    }

    return true;
  }
}
