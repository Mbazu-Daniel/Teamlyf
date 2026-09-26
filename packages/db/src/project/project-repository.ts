import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { member } from "../organization/member";
import { organizationReference } from "./references";
import { project } from "./project";

export const projectRepository = pgTable(
  "project_repository",
  {
    id: uuid("id").$defaultFn(() => generateId()).primaryKey(),
    organizationId: organizationReference(),
    projectId: uuid("project_id").notNull().references(() => project.id, { onDelete: "cascade" }),
    repositoryId: text("repository_id").notNull(),
    repositoryFullName: text("repository_full_name").notNull(),
    defaultBranch: text("default_branch").notNull(),
    baseBranch: text("base_branch").notNull(),
    installationId: text("installation_id"),
    connectedByMemberId: uuid("connected_by_member_id").references(() => member.id, { onDelete: "set null" }),
    connectedAt: timestamp("connected_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("project_repository_project_idx").on(t.projectId),
    uniqueIndex("project_repository_org_repo_idx").on(t.organizationId, t.repositoryId),
    index("project_repository_organization_id_idx").on(t.organizationId),
  ],
);
