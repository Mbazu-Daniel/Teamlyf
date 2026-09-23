import { resolve } from "node:path";
import { config } from "dotenv";
import { z } from "zod";

function loadEnv(): void {
  config({ path: resolve(process.cwd(), "../../.env"), quiet: true });
  config({ path: resolve(process.cwd(), ".env"), quiet: true });
}

const apiEnvSchema = z.object({
  API_PORT: z.coerce.number().int().positive().default(3101),
  WEB_ORIGIN: z.string().url().default("http://localhost:3100"),
  DATABASE_URL: z.string().nonempty(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z
    .string()
    .url()
    .default("http://localhost:3101")
    .transform((url) => url.replace(/\/+$/, "")),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  EMAIL_URL: z.string().url().optional(),
  EMAIL_FROM: z.string().email().optional(),
  STORAGE_ENDPOINT: z.string().url().optional(),
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_ACCESS_KEY_ID: z.string().optional(),
  STORAGE_SECRET_ACCESS_KEY: z.string().optional(),
  LIVEKIT_URL: z.string().url().optional(),
  LIVEKIT_API_KEY: z.string().optional(),
  LIVEKIT_API_SECRET: z.string().optional(),
  AGENT_ENCRYPTION_SECRET: z.string().min(16).optional(),
  BACHS_API_URL: z.string().url().optional(),
  BACHS_API_KEY: z.string().optional(),
  BACHS_WEBHOOK_SECRET: z.string().min(16).optional(),
  BACHS_API_URL: z.string().url().optional(),
  BACHS_API_KEY: z.string().optional(),
  BACHS_WEBHOOK_SECRET: z.string().min(16).optional(),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;

export function parseApiEnv(input: NodeJS.ProcessEnv = process.env): ApiEnv {
  loadEnv();
  return apiEnvSchema.parse(input);
}
