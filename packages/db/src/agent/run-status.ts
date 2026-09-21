import { pgEnum } from "drizzle-orm/pg-core";

export const agentRunStatus = pgEnum("agent_run_status", [
  "queued",
  "running",
  "completed",
  "failed",
  "cancelled",
]);