import { z } from "zod";

export const aiProviderSourceSchema = z.enum(["teamlyf", "byok"]);
export type AiProviderSource = z.infer<typeof aiProviderSourceSchema>;

export const aiProviderSchema = z.object({
  provider: z.string().min(1),
  model: z.string().min(1),
  source: aiProviderSourceSchema,
});
export type AiProvider = z.infer<typeof aiProviderSchema>;

export const aiUsageSchema = z.object({
  organizationId: z.string().min(1),
  userId: z.string().min(1).nullable(),
  agentId: z.string().min(1).nullable(),
  provider: z.string().min(1),
  model: z.string().min(1),
  source: aiProviderSourceSchema,
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  totalTokens: z.number().int().nonnegative(),
  estimatedCostUsd: z.number().nonnegative().nullable(),
  allowanceConsumed: z.number().int().nonnegative(),
  createdAt: z.date(),
});
export type AiUsage = z.infer<typeof aiUsageSchema>;

export interface AiProviderResolver {
  resolve(input: {
    organizationId: string;
    userId?: string;
  }): Promise<AiProvider>;
}

export interface AiUsageRecorder {
  record(usage: AiUsage): Promise<void>;
}
