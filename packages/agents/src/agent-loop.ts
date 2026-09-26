import { agentEventTypes, agentToolNames, type AgentEvent, type AgentPermissionDecision, type AgentPermissionRequest, type AgentToolCall, type AgentToolResult } from "./contracts";
import type { AgentModel, AgentRuntimeState, AgentToolExecutor } from "./runtime";
import { agentToolDefinitions, type AgentToolDefinition } from "./tool-definitions";

export type AgentLoopOptions = {
  state: AgentRuntimeState;
  model: AgentModel;
  executor: AgentToolExecutor;
  emit: (event: AgentEvent) => Promise<void> | void;
  tools?: readonly AgentToolDefinition[];
  checkpoint?: (
    state: AgentRuntimeState,
    reason: AgentRuntimeState["checkpoints"][number]["reason"],
  ) => Promise<void>;
  persistPermission?: (tool: AgentPermissionRequest["tool"]) => Promise<void>;
  initialSequence?: number;
};

type PendingPermission = {
  request: AgentPermissionRequest;
  resolve: (decision: AgentPermissionDecision) => void;
};

export class AgentLoop {
  private sequence: number;
  private readonly pendingPermissions = new Map<string, PendingPermission>();
  private readonly alwaysAllowedTools: Set<string>;
  private readonly recoveredPermissionDecisions = new Map<string, AgentPermissionDecision>();

  constructor(private readonly options: AgentLoopOptions) {
    this.sequence = options.initialSequence ?? 0;
    this.alwaysAllowedTools = new Set(options.state.allowedTools);
  }

  async run(initialMessage: string): Promise<void> {
    this.options.state.messages.push({ role: "user", content: initialMessage });
    await this.checkpoint("message");
    await this.emit("session_started", { message: initialMessage });
    await this.runLoop();
  }

  async resume(): Promise<void> {
    if (this.options.state.pendingPermission) {
      const request = this.options.state.pendingPermission;
      const decision = this.recoveredPermissionDecisions.get(request.id);
      if (!decision) {
        await this.emit("permission_requested", { request, permissionId: request.id });
        return;
      }

      this.recoveredPermissionDecisions.delete(request.id);
      await this.applyPermissionDecision(request, decision);

      const call: AgentToolCall = {
        id: request.id,
        name: request.tool,
        arguments: request.metadata,
      };
      const result: AgentToolResult =
        decision === "reject"
          ? {
              toolCallId: call.id,
              name: call.name,
              ok: false,
              output: null,
              error: "Permission denied by the user.",
            }
          : await this.options.executor.execute(this.options.state.session, call);
      await this.emit("tool_result", { result });
      this.options.state.messages.push({
        role: "tool",
        toolCallId: call.id,
        name: call.name,
        content: JSON.stringify(result),
      });
      await this.checkpoint("tool");
    }
    await this.runLoop();
  }

  private async runLoop(): Promise<void> {
    const tools = this.options.tools ?? agentToolDefinitions;
    const definitions = new Map(tools.map((definition) => [definition.name, definition]));

    while (!this.options.state.interrupted) {
      let toolUsed = false;
      let assistantText = "";
      const toolCalls: AgentToolCall[] = [];

      for await (const chunk of this.options.model.stream(this.options.state.messages, tools)) {
        if (chunk.type === "text" && chunk.text) {
          assistantText += chunk.text;
          await this.emit("assistant_message", { text: chunk.text });
        }

        if (chunk.type === "tool_call" && chunk.toolCall) {
          toolUsed = true;
          toolCalls.push(chunk.toolCall);
          await this.emit("tool_call", { toolCall: chunk.toolCall });
        }
      }

      if (assistantText) {
        this.options.state.messages.push({ role: "assistant", content: assistantText });
      }

      for (const call of toolCalls) {
        this.options.state.messages.push({ role: "assistant_tool_call", toolCall: call });

        const definition = definitions.get(call.name);
        if (!definition) {
          const result: AgentToolResult = {
            toolCallId: call.id,
            name: call.name,
            ok: false,
            output: null,
            error: `Tool '${call.name}' is not available in this agent context.`,
          };
          await this.emit("tool_result", { result });
          this.options.state.messages.push({
            role: "tool",
            toolCallId: call.id,
            name: call.name,
            content: JSON.stringify(result),
          });
          await this.checkpoint("tool");
          continue;
        }

        if (definition.requiresPermission && !this.alwaysAllowedTools.has(call.name)) {
          const request: AgentPermissionRequest = {
            id: call.id,
            tool: call.name,
            scope: call.name,
            reason: "Agent requested an operation that can change data or execute code.",
            metadata: call.arguments,
          };

          this.options.state.pendingPermission = request;
          await this.emit("permission_requested", { request, permissionId: request.id });
          await this.checkpoint("tool");

          const decision = await this.waitForPermission(request);
          await this.applyPermissionDecision(request, decision);

          if (decision === "reject") {
            const result: AgentToolResult = {
              toolCallId: call.id,
              name: call.name,
              ok: false,
              output: null,
              error: "Permission denied by the user.",
            };
            await this.emit("tool_result", { result });
            this.options.state.messages.push({
              role: "tool",
              toolCallId: call.id,
              name: call.name,
              content: JSON.stringify(result),
            });
            await this.checkpoint("tool");
            continue;
          }
        }

        const result = await this.options.executor.execute(this.options.state.session, call);
        await this.emit("tool_result", { result });
        this.options.state.messages.push({
          role: "tool",
          toolCallId: call.id,
          name: call.name,
          content: JSON.stringify(result),
        });
        await this.checkpoint("tool");
      }

      if (!toolUsed) {
        await this.checkpoint("message");
        await this.emit("run_completed", { reason: "model_completed" });
        return;
      }
    }

    await this.emit("run_interrupted", {});
  }

  resolvePermission(requestId: string, decision: AgentPermissionDecision): void {
    const pending = this.pendingPermissions.get(requestId);
    if (pending) {
      this.pendingPermissions.delete(requestId);
      pending.resolve(decision);
      return;
    }
    if (this.options.state.pendingPermission?.id === requestId) {
      this.recoveredPermissionDecisions.set(requestId, decision);
      return;
    }
    throw new Error(`No pending permission request found for ${requestId}`);
  }

  private async applyPermissionDecision(
    request: AgentPermissionRequest,
    decision: AgentPermissionDecision,
  ): Promise<void> {
    this.options.state.pendingPermission = undefined;
    await this.emit("permission_resolved", {
      permissionId: request.id,
      decision,
      tool: request.tool,
    });
    if (decision === "always") {
      this.alwaysAllowedTools.add(request.tool);
      this.options.state.allowedTools = [...this.alwaysAllowedTools].filter(
        (tool): tool is import("./contracts").AgentToolName =>
          agentToolNames.includes(tool as import("./contracts").AgentToolName),
      );
      await this.options.persistPermission?.(request.tool);
    }
  }

  private waitForPermission(request: AgentPermissionRequest): Promise<AgentPermissionDecision> {
    return new Promise((resolve) => {
      this.pendingPermissions.set(request.id, { request, resolve });
    });
  }

  private async checkpoint(
    reason: AgentRuntimeState["checkpoints"][number]["reason"],
  ): Promise<void> {
    const checkpoint = {
      id: crypto.randomUUID(),
      organizationId: this.options.state.session.organizationId,
      sessionId: this.options.state.session.id,
      sequence: this.options.state.checkpoints.length,
      reason,
      state: {
        messages: this.options.state.messages,
        interrupted: this.options.state.interrupted,
        pendingPermission: this.options.state.pendingPermission,
        allowedTools: this.options.state.allowedTools,
      },
      createdAt: new Date(),
    };
    this.options.state.checkpoints.push(checkpoint);
    await this.options.checkpoint?.(this.options.state, reason);
    await this.emit("checkpoint_created", {
      checkpointId: checkpoint.id,
      sequence: checkpoint.sequence,
      reason,
    });
  }

  private async emit(type: AgentEvent["type"], payload: Record<string, unknown>): Promise<void> {
    if (!agentEventTypes.includes(type)) return;
    await this.options.emit({
      id: crypto.randomUUID(),
      sessionId: this.options.state.session.id,
      runId: this.options.state.session.runId,
      type,
      sequence: this.sequence++,
      payload,
      createdAt: new Date(),
    });
  }
}
