import { CanActivate, ExecutionContext, Injectable, SetMetadata } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

const REQUIRED_FEATURE = "required_feature";
export type Feature = "agents" | "calls";

export const RequireFeature = (feature: Feature) => SetMetadata(REQUIRED_FEATURE, feature);

@Injectable()
export class FeatureGateGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    void context;
    void this.reflector;
    return true;
  }
}
