export type BillingPlan = "starter" | "growth" | "scale";

export const planEntitlements: Record<
  BillingPlan,
  {
    agentLimit: number;
    callDurationMinutes: number;
  }
> = {
  starter: { agentLimit: 1, callDurationMinutes: 30 },
  growth: { agentLimit: 5, callDurationMinutes: 60 },
  scale: { agentLimit: 20, callDurationMinutes: 180 },
};
