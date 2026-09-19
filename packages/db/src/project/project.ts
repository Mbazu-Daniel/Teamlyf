import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { organizationReference } from "./references";

export const project = pgTable(
  "project",
  {
    id: uuid("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    organizationId: organizationReference(),
    name: text("name").notNull(),
    description: text("description"),
    identifier: text("identifier").notNull(),
    emoji: text("emoji"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("project_organization_id_idx").on(t.organizationId),
    uniqueIndex("project_identifier_org_idx").on(t.identifier, t.organizationId),
  ],
);
