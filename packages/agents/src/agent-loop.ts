import {
  type AgentEvent,
  type AgentModel,
  type AgentPermissionDecision,
  type AgentPermissionRequest,
  type AgentRuntimeState,
  type AgentToolExecutor,
  type AgentToolResult,
  agentEventTypes,
} from "./index";
import { agentToolDefinitions } from "./tool-definitions";

export type AgentLoopOptions = {
  state: AgentRuntimeState;
  model: AgentModel;
  executor: AgentToolExecutor;
  emit: (event: AgentEvent) => Promise<void> | void;
  checkpoint?: (
    state: AgentRuntimeState,
    reason: AgentRuntimeState["checkpoints"][number]["reason"],
  ) => Promise<void>;
  initialSequence?: number;
};

type PendingPermission = {
  request: AgentPermissionRequest;
  resolve: (decision: AgentPermissionDecision) => void;
};

export class AgentLoop {
  private sequence: number;
  private readonly pendingPermissions = new Map<string, PendingPermission>();
  private readonly alwaysAllowedTools = new Set<string>();

  constructor(private readonly options: AgentLoopOptions) {
    this.sequence = options.initialSequence ?? 0;
  }

  async run(initialMessage: string): Promise<void> {
    this.options.state.messages.push({ role: "user", content: initialMessage });
    await this.checkpoint("message");
    await this.emit("session_started", { message: initialMessage });

    while (!this.options.state.interrupted) {
      let toolUsed = false;
      let assistantText = "";
      const toolCalls = [];

      for await (const chunk of this.options.model.stream(
        this.options.state.messages,
        agentToolDefinitions,
      )) {
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

        const definition = agentToolDefinitions.find((item) => item.name === call.name);
        if (definition?.requiresPermission && !this.alwaysAllowedTools.has(call.name)) {
          const request: AgentPermissionRequest = {
            id: call.id,
            tool: call.name,
            scope: call.name,
            reason: "Agent requested an operation that can change data or execute code.",
            metadata: call.arguments,
          };

          this.options.state.pendingPermission = request;
          await this.emit("permission_requested", { request, permissionId: request.id });

          const decision = await this.waitForPermission(request);
          this.options.state.pendingPermission = undefined;

          await this.emit("permission_resolved", {
            permissionId: request.id,
            decision,
            tool: call.name,
          });

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

          if (decision === "always") this.alwaysAllowedTools.add(call.name);
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
    if (!pending) throw new Error(`No pending permission request found for ${requestId}`);
    this.pendingPermissions.delete(requestId);
    pending.resolve(decision);
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
