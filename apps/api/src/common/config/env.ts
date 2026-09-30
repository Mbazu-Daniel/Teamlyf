import { resolve } from "node:path";
import { config } from "dotenv";
import { z } from "zod";

function loadEnv(): void {
  config({ path: resolve(process.cwd(), "../../.env"), quiet: true });
  config({ path: resolve(process.cwd(), ".env"), quiet: true });
}

const apiEnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(9001),
  WEB_ORIGIN: z
    .string()
    .default("http://localhost:3100")
    .refine(
      (value) =>
        value.split(",").every((entry) => z.string().url().safeParse(entry.trim()).success),
      { message: "must be one or more comma-separated URLs" },
    ),
  DATABASE_URL: z.string().nonempty(),
  REDIS_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z
    .string()
    .url()
    .default("http://localhost:9001")
    .transform((url) => url.replace(/\/+$/, "")),
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

  STORAGE_URL_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
  STORAGE_MAX_UPLOAD_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(25 * 1024 * 1024),

  R2_ACCOUNT_ID: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_ENDPOINT: z.string().optional(),
  R2_PUBLIC_ID: z.string().optional(),
  R2_CUSTOM_DOMAIN: z.string().optional(),

  SENDBYTE_API_KEY: z.string().optional(),
  SENDBYTE_FROM: z.string().optional(),
  SENDBYTE_API_BASE: z.string().url().default("https://api.sendbyte.africa"),

  SENDBYTE_PUBLIC_URL: z.string().url().optional(),
});

const REQUIRED_R2_KEYS = [
  "R2_ACCOUNT_ID",
  "R2_BUCKET_NAME",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
] as const satisfies readonly (keyof ApiEnv)[];

function missingR2Keys(env: Pick<ApiEnv, (typeof REQUIRED_R2_KEYS)[number]>): string[] {
  return REQUIRED_R2_KEYS.filter((key) => !env[key]);
}

export type ApiEnv = z.infer<typeof apiEnvSchema>;

function describeEnvFailure(error: z.ZodError): string {
  const issues = error.issues.map((issue) => {
    const name = issue.path.join(".") || "configuration";
    if (name.startsWith("R2_")) {
      return `${name}: ${issue.message}. File storage is required`;
    }
    if (name === "REDIS_URL") {
      return `${name}: ${issue.message}. Redis carries realtime fan-out, presence and typing — a process-local fallback would drop messages between replicas.`;
    }
    return `${name}: ${issue.message}`;
  });
  return `Invalid API configuration:\n  - ${issues.join("\n  - ")}`;
}

export function parseApiEnv(input: NodeJS.ProcessEnv = process.env): ApiEnv {
  loadEnv();
  const result = apiEnvSchema.safeParse(input);
  if (!result.success) throw new Error(describeEnvFailure(result.error));
  return result.data;
}

/**
 * The one place CORS origins are derived, for both the REST layer and the
 * WebSocket gateway. Socket.IO resolves its options while the decorator is
 * evaluated — before any provider runs — so reading `process.env` inline there
 * would miss a `.env` file that `loadEnv()` has not read yet and would let the
 * two layers disagree about what is allowed. Callers decide how to handle an
 * empty list; nothing here invents a default.
 */
export function webOrigins(): string[] {
  loadEnv();
  return (process.env.WEB_ORIGIN ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}
