import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { memberReference, organizationReference } from "./references";
import { project } from "./project";

export const projectMember = pgTable(
  "project_member",
  {
    id: uuid("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => project.id, { onDelete: "cascade" }),
    organizationId: organizationReference(),
    memberId: memberReference(),
    role: text("role").notNull().default("member"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("project_member_project_id_idx").on(t.projectId),
    index("project_member_organization_id_idx").on(t.organizationId),
    index("project_member_member_id_idx").on(t.memberId),
    uniqueIndex("project_member_project_member_uidx").on(t.projectId, t.memberId),
  ],
);
