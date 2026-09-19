import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { organizationReference } from "./membership-columns";

/**
 * Narrow grants better-auth cannot express:
 * - subjectKind=user + resourceId → instance override
 * - subjectKind=agent → agent grants (agents never go through better-auth roles)
 */
export const permissionGrant = pgTable(
  "permission_grant",
  {
    id: uuid("id")
      .$defaultFn(() => generateId())
      .primaryKey(),
    organizationId: organizationReference(),
    subjectKind: text("subject_kind").notNull(),
    subjectId: uuid("subject_id").notNull(),
    module: text("module").notNull(),
    action: text("action").notNull(),
    resourceId: uuid("resource_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("permission_grant_org_subject_idx").on(
      t.organizationId,
      t.subjectKind,
      t.subjectId,
    ),
    index("permission_grant_module_action_idx").on(t.module, t.action),
    index("permission_grant_resource_id_idx").on(t.resourceId),
  ],
);
