import { resolve } from "node:path";
import { config } from "dotenv";
import { z } from "zod";

function loadEnv(): void {
  config({ path: resolve(process.cwd(), "../../.env"), quiet: true });
  config({ path: resolve(process.cwd(), ".env"), quiet: true });
}

const apiEnvSchema = z.object({
  API_PORT: z.coerce.number().int().positive().default(3101),
  WEB_ORIGIN: z
    .string()
    .default("http://localhost:3100")
    .refine(
      (value) => value.split(",").every((entry) => z.string().url().safeParse(entry.trim()).success),
      { message: "must be one or more comma-separated URLs" },
    ),
  DATABASE_URL: z.string().nonempty(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3101").transform((url) => url.replace(/\/+$/, "")),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  LIVEKIT_URL: z.string().url().optional(),
  LIVEKIT_API_KEY: z.string().optional(),
  LIVEKIT_API_SECRET: z.string().optional(),
  BACHS_API_URL: z.string().url().optional(),
  BACHS_API_KEY: z.string().optional(),
  BACHS_WEBHOOK_SECRET: z.string().optional(),
  AGENT_ENCRYPTION_SECRET: z.string().optional(),
  AGENT_MANAGED_API_KEY: z.string().optional(),
  AGENT_OPENAI_BASE_URL: z.string().url().default("https://api.openai.com/v1"),
  AGENT_MODEL: z.string().min(1).default("gpt-5.6-luna"),
  GITHUB_APP_ID: z.coerce.number().int().positive().optional(),
  GITHUB_APP_PRIVATE_KEY: z.string().optional(),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;

export function parseApiEnv(input: NodeJS.ProcessEnv = process.env): ApiEnv {
  loadEnv();
  return apiEnvSchema.parse(input);
}
