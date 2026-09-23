import { IsIn, IsUrl } from "class-validator";

export type BillingPlan = "starter" | "growth" | "scale";

export class CheckoutDto {
  @IsIn(["starter", "growth", "scale"])
  plan!: BillingPlan;

  @IsUrl()
  successUrl!: string;

  @IsUrl()
  cancelUrl!: string;
}
