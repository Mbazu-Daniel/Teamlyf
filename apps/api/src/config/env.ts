import { z } from "zod";

export const apiEnvSchema = z.object({
  API_PORT: z.coerce.number().int().positive().default(3101),
  WEB_ORIGIN: z.string().url().default("http://localhost:3100"),
  DATABASE_URL: z.string().nonempty(),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;

export function parseApiEnv(input: NodeJS.ProcessEnv = process.env): ApiEnv {
  return apiEnvSchema.parse(input);
}
