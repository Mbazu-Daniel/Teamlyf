export type BillingPlan = "starter" | "growth" | "scale";

export type PlanEntitlements = {
  seatLimit: number;
  agentLimit: number;
  callDurationMinutes: number;
};

export const planEntitlements: Record<BillingPlan, PlanEntitlements> = {
  starter: { seatLimit: 5, agentLimit: 1, callDurationMinutes: 30 },
  growth: { seatLimit: 50, agentLimit: 5, callDurationMinutes: 60 },
  scale: { seatLimit: 250, agentLimit: 20, callDurationMinutes: 180 },
};
