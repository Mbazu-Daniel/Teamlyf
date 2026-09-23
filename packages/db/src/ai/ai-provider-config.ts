import {
  boolean,
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { generateId } from "../id";
import { aiProviderSource } from "./provider-source";
import { organizationReference } from "../organization/membership";

export const aiProviderConfig = pgTable(
  "ai_provider_config",
  {
    id: uuid("id").$defaultFn(() => generateId()).primaryKey(),
    organizationId: organizationReference(),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    source: aiProviderSource("source").notNull(),
    encryptedApiKey: text("encrypted_api_key"),
    keyVersion: text("key_version"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    check("ai_provider_config_provider_non_empty_check", sql`length(trim(${t.provider})) > 0`),
    check("ai_provider_config_model_non_empty_check", sql`length(trim(${t.model})) > 0`),
    check(
      "ai_provider_config_byok_key_check",
      sql`(${t.source} = 'byok' AND ${t.encryptedApiKey} IS NOT NULL) OR (${t.source} = 'teamlyf' AND ${t.encryptedApiKey} IS NULL)`,
    ),
    check(
      "ai_provider_config_key_version_check",
      sql`(${t.encryptedApiKey} IS NULL AND ${t.keyVersion} IS NULL) OR (${t.encryptedApiKey} IS NOT NULL AND ${t.keyVersion} IS NOT NULL)`,
    ),
    index("ai_provider_config_organization_id_idx").on(t.organizationId),
    uniqueIndex("ai_provider_config_org_source_provider_model_idx").on(
      t.organizationId,
      t.source,
      t.provider,
      t.model,
    ),
  ],
);
