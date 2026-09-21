import { z } from "zod";

export const agentIdSchema = z.string().uuid();
export const organizationIdSchema = z.string().uuid();

export const agentSchema = z.object({
  id: agentIdSchema,
  organizationId: organizationIdSchema,
  name: z.string().min(1),
  description: z.string().nullable(),
  enabled: z.boolean(),
});

export type Agent = z.infer<typeof agentSchema>;