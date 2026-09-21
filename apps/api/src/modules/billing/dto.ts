import { IsIn, IsString } from "class-validator";
export class CheckoutDto { @IsIn(["starter", "growth", "scale"]) plan!: "starter" | "growth" | "scale"; @IsString() successUrl!: string; @IsString() cancelUrl!: string; }
