import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import * as schema from "@teamlyf/db/schema";
import * as organizationSchema from "@teamlyf/db/organization-schema";
import { generateId } from "@teamlyf/db";
import { hashPassword, verifyPassword } from "../helpers/hash-password";
import type { CreateAuthOptions } from "../types/index";
import { ac, admin, member, owner } from "../better-auth/permissions";

export const API_VERSION_PATH = "/api/v1";

function resolveSocialProviders(google: CreateAuthOptions["google"]) {
  if (google === undefined) return undefined;
  const { clientId, clientSecret } = google;
  if (!clientId || !clientSecret) return undefined;
  return {
    google: { clientId, clientSecret },
  };
}

export function createAuth(options: CreateAuthOptions) {
  const socialProviders = resolveSocialProviders(options.google);

  return betterAuth({
    basePath: `${API_VERSION_PATH}/auth`,
    database: drizzleAdapter(options.db, {
      provider: "pg",
      schema: { ...schema, ...organizationSchema },
    }),
    secret: options.secret,
    baseURL: options.baseURL,
    trustedOrigins: options.webOrigin.split(",").map((origin) => origin.trim()).filter(Boolean),
    session: {\n      // Keep active users signed in for 30 days and extend the session daily.\n      // Better Auth refreshes the server-side session cookie through normal session requests.\n      expiresIn: 60 * 60 * 24 * 30,\n      updateAge: 60 * 60 * 24,\n    },\n    advanced: {
      database: {
        generateId,
      },
    },
    emailAndPassword: {
      enabled: true,
      password: {
        hash: hashPassword,
        verify: verifyPassword,
      },
    },
    socialProviders,
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: socialProviders ? ["google", "email-password"] : ["email-password"],
      },
    },
    plugins: [
      organization({
        ac,
        roles: { owner, admin, member },
        dynamicAccessControl: { enabled: true },
    schema: {
      member: {
        additionalFields: {
          firstName: { type: "string", required: false, returned: true, stored: true, input: true },
          lastName: { type: "string", required: false, returned: true, stored: true, input: true },
        },
      },
    },
        // ponytail: invitation IDs are uuidv7 (opaque, not guessable), so the verified-email
        // gate on by-ID invitation actions is not load-bearing yet and no email-verification
        // flow exists. Flip to `true` once email verification is wired.
        requireEmailVerificationOnInvitation: false,
      }),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;
