import { index, integer, pgTable, text, timestamp, uuid, type AnyPgColumn } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { project } from "./project";

export const label = pgTable(
  "label",
  {
    id: uuid("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references((): AnyPgColumn => label.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    color: text("color").notNull().default("#60646C"),
    sequence: integer("sequence").notNull().default(65535),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("label_project_id_idx").on(t.projectId),
    index("label_parent_id_idx").on(t.parentId),
  ],
);
