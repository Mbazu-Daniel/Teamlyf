import { pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";

export const organization = pgTable(
  "organization",
  {
    id: uuid("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logo: text("logo"),
    metadata: text("metadata"),
    plan: text("plan").notNull().default("starter"),
    bachsCustomerId: text("bachs_customer_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("organization_slug_idx").on(t.slug)],
);
