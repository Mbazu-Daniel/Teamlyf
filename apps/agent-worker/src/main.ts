import "dotenv/config";
import { createDecipheriv, createHash } from "node:crypto";
import { Worker } from "bullmq";
import { createDb } from "@teamlyf/db";
import { agent, agentAuditLog, agentCredential, agentTask, channel, document, message, note } from "@teamlyf/db/workspace-schema";
import { permissionGrant } from "@teamlyf/db/organization-schema";
import type { AgentTaskEnvelope } from "@teamlyf/types";
import { and, eq, isNull } from "drizzle-orm";

const databaseUrl = required("DATABASE_URL");
const redisUrl = required("REDIS_URL");
const encryptionKey = required("AGENT_ENCRYPTION_KEY");
const { db, client } = createDb(databaseUrl);

type ToolResult = { output: Record<string, unknown>; requiresApproval?: boolean; action: string };

const worker = new Worker<AgentTaskEnvelope>("agent-tasks", async (job) => {
  const payload = job.data;
  await db.update(agentTask).set({ status: "running", startedAt: new Date() }).where(and(eq(agentTask.id, payload.id), eq(agentTask.organizationId, payload.organizationId)));
  try {
    const configuredAgent = await db.query.agent.findFirst({ where: and(eq(agent.id, payload.agentId), eq(agent.organizationId, payload.organizationId)) });
    if (!configuredAgent) throw new Error("Agent not found in organization");
    const result = await execute(payload, configuredAgent.capabilityType);
    const status = result.requiresApproval ? "awaiting_approval" : "completed";
    await db.update(agentTask).set({ status, approvalStatus: result.requiresApproval ? "pending" : "not_required", output: JSON.stringify(result.output), toolCalls: JSON.stringify([{ name: result.action }]), completedAt: result.requiresApproval ? null : new Date() }).where(eq(agentTask.id, payload.id));
    await db.insert(agentAuditLog).values({ organizationId: payload.organizationId, agentId: payload.agentId, agentTaskId: payload.id, action: result.action, input: JSON.stringify(redact(payload.input)), output: JSON.stringify(result.output) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown agent execution error";
    await db.update(agentTask).set({ status: "failed", error: message, completedAt: new Date() }).where(eq(agentTask.id, payload.id));
    throw error;
  }
}, { connection: { url: redisUrl }, concurrency: 5 });

worker.on("failed", (job, error) => console.error(`Agent job ${job?.id ?? "unknown"} failed:`, error.message));
worker.on("ready", () => console.log("Teamlyf agent worker ready"));

async function execute(payload: AgentTaskEnvelope, capability: string): Promise<ToolResult> {
  const input = payload.input;
  switch (capability) {
    case "docs": return documentCapability(payload, input);
    case "notes": return noteCapability(payload, input);
    case "chat": return chatCapability(payload, input);
    case "coding": return codingCapability(payload, input);
    default: throw new Error(`Unknown agent capability: ${capability}`);
  }
}

async function documentCapability(payload: AgentTaskEnvelope, input: Record<string, unknown>): Promise<ToolResult> {
  if (input.tool === "updateDocument" && typeof input.documentId === "string") {
    await assertAgentPermission(payload, "docs", "update");
    const [updated] = await db.update(document).set({ title: stringValue(input.title), content: stringValue(input.content), updatedAt: new Date() }).where(and(eq(document.id, input.documentId), eq(document.organizationId, payload.organizationId))).returning();
    if (!updated) throw new Error("Document not found"); return { action: "docs.updateDocument", output: { documentId: updated.id } };
  }
  await assertAgentPermission(payload, "docs", "create");
  const [created] = await db.insert(document).values({ organizationId: payload.organizationId, ownerId: requiredInput(input, "ownerId"), title: requiredInput(input, "title"), content: stringValue(input.content), mimeType: "text/markdown" }).returning();
  return { action: "docs.createDocument", output: { documentId: created.id } };
}

async function noteCapability(payload: AgentTaskEnvelope, input: Record<string, unknown>): Promise<ToolResult> {
  if (input.tool === "updateNote" && typeof input.noteId === "string") {
    await assertAgentPermission(payload, "notes", "update");
    const [updated] = await db.update(note).set({ title: stringValue(input.title), content: stringValue(input.content), updatedAt: new Date() }).where(and(eq(note.id, input.noteId), eq(note.organizationId, payload.organizationId))).returning();
    if (!updated) throw new Error("Note not found"); return { action: "notes.updateNote", output: { noteId: updated.id } };
  }
  await assertAgentPermission(payload, "notes", "create");
  const [created] = await db.insert(note).values({ organizationId: payload.organizationId, createdById: requiredInput(input, "memberId"), title: requiredInput(input, "title"), content: stringValue(input.content) }).returning();
  return { action: "notes.createNote", output: { noteId: created.id } };
}

async function chatCapability(payload: AgentTaskEnvelope, input: Record<string, unknown>): Promise<ToolResult> {
  await assertAgentPermission(payload, "chat", "create");
  const channelId = requiredInput(input, "channelId");
  const target = await db.query.channel.findFirst({ where: and(eq(channel.id, channelId), eq(channel.organizationId, payload.organizationId)) });
  if (!target) throw new Error("Channel not found");
  const [created] = await db.insert(message).values({ channelId, senderKind: "agent", senderId: payload.agentId, content: requiredInput(input, "content") }).returning();
  return { action: "chat.respondInChannel", output: { messageId: created.id } };
}

async function codingCapability(payload: AgentTaskEnvelope, input: Record<string, unknown>): Promise<ToolResult> {
  await assertAgentPermission(payload, "pm", "update");
  const token = await credential(payload.organizationId, payload.agentId, "github");
  const repo = requiredInput(input, "repo");
  const response = await fetch(`https://api.github.com/repos/${repo}/pulls`, { method: "POST", headers: { authorization: `Bearer ${token}`, accept: "application/vnd.github+json", "content-type": "application/json", "x-github-api-version": "2022-11-28" }, body: JSON.stringify({ title: requiredInput(input, "title"), head: requiredInput(input, "head"), base: requiredInput(input, "base"), body: stringValue(input.body) }) });
  if (!response.ok) throw new Error(`GitHub pull request failed (${response.status})`);
  const result = await response.json() as { html_url?: string; number?: number };
  return { action: "coding.openPullRequest", output: { pullRequestUrl: result.html_url, number: result.number }, requiresApproval: true };
}

async function assertAgentPermission(payload: AgentTaskEnvelope, module: string, action: string) {
  const grant = await db.query.permissionGrant.findFirst({ where: and(eq(permissionGrant.organizationId, payload.organizationId), eq(permissionGrant.subjectKind, "agent"), eq(permissionGrant.subjectId, payload.agentId), eq(permissionGrant.module, module), eq(permissionGrant.action, action), isNull(permissionGrant.resourceId)) });
  if (!grant) throw new Error(`Agent is not granted ${module}:${action}`);
}

async function credential(organizationId: string, agentId: string, provider: string): Promise<string> {
  const encrypted = await db.query.agentCredential.findFirst({ where: and(eq(agentCredential.organizationId, organizationId), eq(agentCredential.agentId, agentId), eq(agentCredential.provider, provider)) });
  if (!encrypted) throw new Error(`Missing ${provider} credential`);
  const key = createHash("sha256").update(encryptionKey).digest();
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(encrypted.iv, "base64"));
  decipher.setAuthTag(Buffer.from(encrypted.authTag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(encrypted.cipherText, "base64")), decipher.final()]).toString("utf8");
}
function required(name: string): string { const value = process.env[name]; if (!value) throw new Error(`${name} is required`); return value; }
function requiredInput(input: Record<string, unknown>, key: string): string { const value = input[key]; if (typeof value !== "string" || !value) throw new Error(`${key} is required`); return value; }
function stringValue(value: unknown): string { return typeof value === "string" ? value : ""; }
function redact(input: Record<string, unknown>): Record<string, unknown> { return Object.fromEntries(Object.entries(input).map(([key, value]) => /token|secret|password/i.test(key) ? [key, "[REDACTED]"] : [key, value])); }

process.on("SIGTERM", async () => { await worker.close(); await client.end(); process.exit(0); });
