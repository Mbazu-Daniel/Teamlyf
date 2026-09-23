import type { BillingPlan } from "./billing.dto";

export const planEntitlements: Record<
  BillingPlan,
  {
    agentLimit: number;
    callDurationMinutes: number;
    seatLimit: number;
  }
> = {
  starter: { agentLimit: 1, callDurationMinutes: 30, seatLimit: 5 },
  growth: { agentLimit: 5, callDurationMinutes: 60, seatLimit: 50 },
  scale: { agentLimit: 20, callDurationMinutes: 180, seatLimit: 250 },
};
