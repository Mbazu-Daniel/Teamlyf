import { Body, Controller, Get, Headers, Param, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { SessionGuard } from "../../common/better-auth/session.guard";
import { OrgMemberGuard, PermissionsGuard, RequirePermission } from "../rbac";
import { BillingService } from "./billing.service";
import { CheckoutDto } from "./dto";
type RawRequest = Request & { rawBody?: Buffer };
@ApiTags("Billing") @Controller()
export class BillingController {
  constructor(private readonly billing: BillingService) {}
  @Get("organization/:orgId/billing") @ApiBearerAuth() @UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard) @RequirePermission("billing", "read") summary(@Param("orgId") orgId: string) { return this.billing.summary(orgId); }
  @Post("organization/:orgId/billing/checkout") @ApiBearerAuth() @UseGuards(SessionGuard, OrgMemberGuard, PermissionsGuard) @RequirePermission("billing", "create") checkout(@Param("orgId") orgId: string, @Body() body: CheckoutDto) { return this.billing.checkout(orgId, body); }
  @Post("webhooks/bachs") webhook(@Req() req: RawRequest, @Headers("x-bachs-signature") signature?: string) { return this.billing.handleWebhook(req.rawBody ?? Buffer.from(JSON.stringify(req.body)), signature); }
}
