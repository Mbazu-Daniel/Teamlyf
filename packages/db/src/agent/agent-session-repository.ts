import { eq } from "drizzle-orm";
import type { Database } from "../index";
import { agentEvent } from "./agent-event";
import { agentSession } from "./agent-session";

export type AgentSessionRecord = {
  id: string;
  organizationId: string;
  runId: string;
  agentId: string;
  memberId: string;
  projectId: string;
  taskId: string;
  workspaceRoot?: string;
  workingBranch?: string;
  metadata?: Record<string, unknown>;
};

export class AgentSessionRepository {
  constructor(private readonly db: Database) {}

  async createSession(session: AgentSessionRecord): Promise<void> {
    await this.db.insert(agentSession).values({
      id: session.id,
      organizationId: session.organizationId,
      runId: session.runId,
      agentId: session.agentId,
      memberId: session.memberId,
      projectId: session.projectId,
      taskId: session.taskId,
      workspaceRoot: session.workspaceRoot,
      workingBranch: session.workingBranch,
      metadata: session.metadata,
    });
  }

  async updateSession(
    runId: string,
    update: {
      status?: "active" | "completed" | "failed" | "interrupted";
      endedAt?: Date;
    },
  ): Promise<void> {
    await this.db.update(agentSession).set(update).where(eq(agentSession.runId, runId));
  }

  async appendEvent(event: {
    id: string;
    organizationId: string;
    sessionId: string;
    sequence: number;
    type: string;
    payload: Record<string, unknown>;
    createdAt: Date;
  }): Promise<void> {
    await this.db.insert(agentEvent).values({
      id: event.id,
      organizationId: event.organizationId,
      sessionId: event.sessionId,
      sequence: event.sequence,
      type: event.type,
      payload: event.payload,
      createdAt: event.createdAt,
    });
  }
}
