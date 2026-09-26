import { pgEnum } from "drizzle-orm/pg-core";

export const agentSessionStatus = pgEnum("agent_session_status", [
  "active",
  "completed",
  "failed",
  "interrupted",
]);
