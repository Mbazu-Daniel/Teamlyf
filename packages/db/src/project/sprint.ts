import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { organizationReference } from "./references";

export const sprint = pgTable(
  "sprint",
  {
    id: uuid("id").$defaultFn(() => generateId()).primaryKey(),
    organizationId: organizationReference(),
    projectId: uuid("project_id").notNull(),
    name: text("name").notNull(),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    status: text("status").notNull().default("planned"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("sprint_organization_id_idx").on(t.organizationId),
    index("sprint_project_id_idx").on(t.projectId),
    index("sprint_status_idx").on(t.status),
  ],
);
