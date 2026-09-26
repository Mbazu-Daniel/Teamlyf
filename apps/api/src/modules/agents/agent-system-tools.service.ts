import { Injectable } from "@nestjs/common";
import { Inject } from "@nestjs/common";
import type { Database } from "@teamlyf/db";
import { chatSchema, documentsSchema, hrSchema, notesSchema, organizationSchema, projectSchema } from "@teamlyf/db";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import type { AgentToolCall, AgentToolRegistration, AgentSession } from "@teamlyf/agents";
import { DATABASE } from "../../common/db/db.provider";

const { channel, channelMember, message } = chatSchema;
const { document } = documentsSchema;
const { note } = notesSchema;
const { leaveRequest, memberProfile } = hrSchema;
const { member } = organizationSchema;
const { project, task } = projectSchema;

@Injectable()
export class AgentSystemToolsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  registrations(): AgentToolRegistration[] {
    return [
      this.tool("get_project", (s, a) => this.getProject(s, a)),
      this.tool("list_tasks", (s, a) => this.listTasks(s, a)),
      this.tool("update_task", (s, a) => this.updateTask(s, a)),
      this.tool("search_documents", (s, a) => this.searchDocuments(s, a)),
      this.tool("read_document", (s, a) => this.readDocument(s, a)),
      this.tool("create_document", (s, a) => this.createDocument(s, a)),
      this.tool("search_notes", (s, a) => this.searchNotes(s, a)),
      this.tool("read_note", (s, a) => this.readNote(s, a)),
      this.tool("update_note", (s, a) => this.updateNote(s, a)),
      this.tool("search_chat", (s, a) => this.searchChat(s, a)),
      this.tool("send_chat_message", (s, a) => this.sendChatMessage(s, a)),
      this.tool("get_member_profile", (s, a) => this.getMemberProfile(s, a)),
      this.tool("list_leave_requests", (s, a) => this.listLeaveRequests(s, a)),
    ];
  }

  private tool(name: AgentToolRegistration["name"], handler: (s: AgentSession, a: AgentToolCall) => Promise<unknown>): AgentToolRegistration {
    return { name, handler };
  }

  private stringArg(call: AgentToolCall, name: string, required = true): string | undefined {
    const value = call.arguments[name];
    if (typeof value !== "string" || !value.trim()) {
      if (required) throw new Error(name + " is required");
      return undefined;
    }
    return value.trim();
  }

  private async getProject(session: AgentSession, call: AgentToolCall) {
    const projectId = this.stringArg(call, "projectId") ?? session.projectId;
    if (!projectId) throw new Error("projectId is required");
    const row = await this.db.query.project.findFirst({
      where: and(eq(project.id, projectId), eq(project.organizationId, session.organizationId)),
    });
    if (!row) throw new Error("Project not found");
    return row;
  }

  // fallow-ignore-next-line complexity -- task filtering combines optional project, status and text constraints.
  private async listTasks(session: AgentSession, call: AgentToolCall) {
    const projectId = this.stringArg(call, "projectId") ?? session.projectId;
    if (!projectId) throw new Error("projectId is required");
    const query = this.stringArg(call, "query", false);
    const statusId = this.stringArg(call, "statusId", false);
    const conditions = [
      eq(task.projectId, projectId),
      eq(project.id, projectId),
      eq(project.organizationId, session.organizationId),
    ];
    if (statusId) conditions.push(eq(task.statusId, statusId));
    if (query) conditions.push(or(ilike(task.name, "%" + query + "%"), ilike(task.description, "%" + query + "%"))!);
    return this.db.select().from(task).innerJoin(project, eq(task.projectId, project.id))
      .where(and(...conditions)).orderBy(desc(task.updatedAt)).limit(100);
  }

  // fallow-ignore-next-line complexity -- task updates normalize multiple optional fields and enforce organization ownership.
  private async updateTask(session: AgentSession, call: AgentToolCall) {
    const taskId = this.stringArg(call, "taskId")!;
    const target = await this.db.query.task.findFirst({
      where: eq(task.id, taskId),
      with: { project: true },
    });
    if (!target || target.project.organizationId !== session.organizationId) throw new Error("Task not found");
    const values: Record<string, unknown> = { updatedAt: new Date() };
    for (const key of ["name", "description", "priority", "statusId", "targetDate"] as const) {
      const value = call.arguments[key];
      if (typeof value === "string") values[key] = key === "targetDate" ? new Date(value) : value;
    }
    if (Object.keys(values).length === 1) throw new Error("No task fields were provided");
    const [updated] = await this.db.update(task).set(values).where(eq(task.id, taskId)).returning();
    return updated;
  }

  private async searchDocuments(session: AgentSession, call: AgentToolCall) {
    const query = this.stringArg(call, "query")!;
    const pattern = "%" + query.replace(/[\\%_]/g, "\\$&") + "%";
    return this.db.query.document.findMany({
      where: and(eq(document.organizationId, session.organizationId), or(ilike(document.title, pattern), ilike(document.content, pattern))),
      columns: { id: true, title: true, mimeType: true, updatedAt: true },
      orderBy: (row, { desc }) => desc(row.updatedAt),
      limit: 50,
    });
  }

  private async readDocument(session: AgentSession, call: AgentToolCall) {
    const documentId = this.stringArg(call, "documentId")!;
    const row = await this.db.query.document.findFirst({
      where: and(eq(document.id, documentId), eq(document.organizationId, session.organizationId)),
    });
    if (!row) throw new Error("Document not found");
    return row;
  }

  private async createDocument(session: AgentSession, call: AgentToolCall) {
    const title = this.stringArg(call, "title")!;
    const content = this.stringArg(call, "content")!;
    const parentId = this.stringArg(call, "parentId", false);
    const [created] = await this.db.insert(document).values({
      organizationId: session.organizationId,
      ownerId: session.memberId,
      title,
      content,
      parentId: parentId ?? null,
    }).returning();
    return created;
  }

  private async searchNotes(session: AgentSession, call: AgentToolCall) {
    const query = this.stringArg(call, "query")!;
    const pattern = "%" + query.replace(/[\\%_]/g, "\\$&") + "%";
    return this.db.query.note.findMany({
      where: and(eq(note.organizationId, session.organizationId), or(ilike(note.title, pattern), ilike(note.content, pattern))),
      orderBy: (row, { desc }) => desc(row.updatedAt),
      limit: 50,
    });
  }

  private async readNote(session: AgentSession, call: AgentToolCall) {
    const noteId = this.stringArg(call, "noteId")!;
    const row = await this.db.query.note.findFirst({
      where: and(eq(note.id, noteId), eq(note.organizationId, session.organizationId)),
    });
    if (!row) throw new Error("Note not found");
    return row;
  }

  // fallow-ignore-next-line complexity -- note updates validate ownership and normalize optional fields.
  private async updateNote(session: AgentSession, call: AgentToolCall) {
    const noteId = this.stringArg(call, "noteId")!;
    const target = await this.db.query.note.findFirst({
      where: and(eq(note.id, noteId), eq(note.organizationId, session.organizationId)),
    });
    if (!target) throw new Error("Note not found");
    const values: Record<string, unknown> = { updatedAt: new Date() };
    for (const key of ["title", "content"] as const) {
      const value = call.arguments[key];
      if (typeof value === "string") values[key] = value;
    }
    if (Object.keys(values).length === 1) throw new Error("No note fields were provided");
    const [updated] = await this.db.update(note).set(values).where(eq(note.id, noteId)).returning();
    return updated;
  }

  private async requireChannelAccess(session: AgentSession, channelId: string) {
    const row = await this.db.query.channel.findFirst({
      where: and(eq(channel.id, channelId), eq(channel.organizationId, session.organizationId)),
    });
    if (!row) throw new Error("Channel not found");
    if (!row.isPrivate) return row;
    const membership = await this.db.query.channelMember.findFirst({
      where: and(eq(channelMember.channelId, channelId), eq(channelMember.memberId, session.memberId)),
    });
    if (!membership) throw new Error("Agent member is not a channel member");
    return row;
  }

  private async searchChat(session: AgentSession, call: AgentToolCall) {
    const channelId = this.stringArg(call, "channelId")!;
    const query = this.stringArg(call, "query")!;
    await this.requireChannelAccess(session, channelId);
    const pattern = "%" + query.replace(/[\\%_]/g, "\\$&") + "%";
    return this.db.query.message.findMany({
      where: and(eq(message.channelId, channelId), ilike(message.content, pattern)),
      orderBy: (row, { desc }) => desc(row.createdAt),
      limit: 50,
    });
  }

  private async sendChatMessage(session: AgentSession, call: AgentToolCall) {
    const channelId = this.stringArg(call, "channelId")!;
    const content = this.stringArg(call, "content")!;
    await this.requireChannelAccess(session, channelId);
    const threadRootId = this.stringArg(call, "threadRootId", false);
    const [created] = await this.db.insert(message).values({
      channelId,
      senderKind: "member",
      senderId: session.memberId,
      content,
      threadRootId: threadRootId ?? null,
    }).returning();
    return created;
  }

  private async getMemberProfile(session: AgentSession, call: AgentToolCall) {
    const memberId = this.stringArg(call, "memberId", false) ?? session.memberId;
    const [memberRow, profile] = await Promise.all([
      this.db.query.member.findFirst({
        where: and(eq(member.id, memberId), eq(member.organizationId, session.organizationId)),
        columns: { id: true, firstName: true, lastName: true, role: true },
      }),
      this.db.query.memberProfile.findFirst({
        where: and(eq(memberProfile.memberId, memberId), eq(memberProfile.organizationId, session.organizationId)),
      }),
    ]);
    if (!memberRow) throw new Error("Member not found");
    return { member: memberRow, profile: profile ?? null };
  }

  private async listLeaveRequests(session: AgentSession, call: AgentToolCall) {
    const memberId = this.stringArg(call, "memberId", false) ?? session.memberId;
    const status = this.stringArg(call, "status", false);
    const conditions = [
      eq(leaveRequest.organizationId, session.organizationId),
      eq(leaveRequest.memberId, memberId),
    ];
    if (status) conditions.push(eq(leaveRequest.status, status));
    return this.db.query.leaveRequest.findMany({
      where: and(...conditions),
      orderBy: (row, { desc }) => desc(row.createdAt),
      limit: 50,
    });
  }
}
