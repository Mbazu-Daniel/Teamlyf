import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { memberReference } from "./references";
import { project } from "./project";

export const milestone = pgTable(
  "milestone",
  {
    id: uuid("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    status: text("status").notNull().default("planned"),
    startDate: timestamp("start_date", { mode: "date" }),
    targetDate: timestamp("target_date", { mode: "date" }),
    createdById: memberReference("created_by_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("milestone_project_id_idx").on(t.projectId)],
);
