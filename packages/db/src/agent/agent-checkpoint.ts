import { index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { generateId } from "../id";
import { organizationReference } from "../organization/membership-columns";
import { agentSession } from "./agent-session";

export const agentCheckpoint = pgTable(
  "agent_checkpoint",
  {
    id: uuid("id").$defaultFn(() => generateId()).primaryKey(),
    organizationId: organizationReference(),
    sessionId: uuid("session_id").notNull().references(() => agentSession.id, { onDelete: "cascade" }),
    sequence: integer("sequence").notNull(),
    reason: text("reason").notNull(),
    state: jsonb("state").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("agent_checkpoint_organization_id_idx").on(t.organizationId),
    index("agent_checkpoint_session_sequence_idx").on(t.sessionId, t.sequence),
  ],
);
