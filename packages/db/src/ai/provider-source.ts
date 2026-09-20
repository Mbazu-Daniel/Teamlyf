import { pgEnum } from "drizzle-orm/pg-core";

export const aiProviderSource = pgEnum("ai_provider_source", ["teamlyf", "byok"]);
