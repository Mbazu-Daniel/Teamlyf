import { and, desc, eq } from "drizzle-orm";
import type { Database } from "../index";
import { agentCheckpoint } from "./agent-checkpoint";
import { agentEvent } from "./agent-event";
import { agentPermissionPolicy } from "./agent-permission-policy";
import { agentSession } from "./agent-session";

export type AgentSessionRecord = {
  id: string;
  organizationId: string;
  runId: string;
  agentId: string;
  memberId: string;
  projectId?: string;
  taskId?: string;
  contextType: string;
  contextId?: string;
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
      contextType: session.contextType,
      contextId: session.contextId,
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

  async createCheckpoint(checkpoint: {
    id: string;
    organizationId: string;
    sessionId: string;
    sequence: number;
    reason: "tool" | "message" | "manual";
    state: Record<string, unknown>;
    createdAt: Date;
  }): Promise<void> {
    await this.db.insert(agentCheckpoint).values(checkpoint);
  }

  async loadLatestCheckpoint(sessionId: string) {
    const rows = await this.db
      .select()
      .from(agentCheckpoint)
      .where(eq(agentCheckpoint.sessionId, sessionId))
      .orderBy(desc(agentCheckpoint.sequence))
      .limit(1);
    const checkpoint = rows[0];
    if (!checkpoint) return undefined;
    return {
      id: checkpoint.id,
      organizationId: checkpoint.organizationId,
      sessionId: checkpoint.sessionId,
      sequence: checkpoint.sequence,
      reason: checkpoint.reason as "tool" | "message" | "manual",
      state: checkpoint.state as Record<string, unknown>,
      createdAt: checkpoint.createdAt,
    };
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
      organizationId: this.organizationId,
      sessionId: event.sessionId,
      sequence: event.sequence,
      type: event.type,
      payload: event.payload,
      createdAt: event.createdAt,
    });
  }

  async loadAllowedTools(
    organizationId: string,
    memberId: string,
    agentId: string,
  ): Promise<string[]> {
    const rows = await this.db
      .select({ tool: agentPermissionPolicy.tool })
      .from(agentPermissionPolicy)
      .where(
        and(
          eq(agentPermissionPolicy.organizationId, organizationId),
          eq(agentPermissionPolicy.memberId, memberId),
          eq(agentPermissionPolicy.agentId, agentId),
          eq(agentPermissionPolicy.effect, "allow"),
        ),
      );

    return rows.map((row) => row.tool);
  }

  async allowTool(
    organizationId: string,
    memberId: string,
    agentId: string,
    tool: string,
  ): Promise<void> {
    await this.db
      .insert(agentPermissionPolicy)
      .values({ organizationId, memberId, agentId, tool, effect: "allow" })
      .onConflictDoUpdate({
        target: [
          agentPermissionPolicy.organizationId,
          agentPermissionPolicy.memberId,
          agentPermissionPolicy.agentId,
          agentPermissionPolicy.tool,
        ],
        set: { effect: "allow", updatedAt: new Date() },
      });
  }
}
