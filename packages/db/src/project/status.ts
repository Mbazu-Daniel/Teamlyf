import { boolean, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { project } from "./project";

export const status = pgTable(
  "status",
  {
    id: uuid("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull().default("#60646C"),
    group: text("group").notNull().default("todo"),
    sequence: integer("sequence").notNull().default(65535),
    default: boolean("default").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("status_project_id_idx").on(t.projectId)],
);
