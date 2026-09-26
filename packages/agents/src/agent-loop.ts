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
};

type PendingPermission = {
  request: AgentPermissionRequest;
  resolve: (decision: AgentPermissionDecision) => void;
};

export class AgentLoop {
  private sequence = 0;
  private readonly pendingPermissions = new Map<string, PendingPermission>();
  private readonly alwaysAllowedTools = new Set<string>();

  constructor(private readonly options: AgentLoopOptions) {}

  async run(initialMessage: string): Promise<void> {
    this.options.state.messages.push({ role: "user", content: initialMessage });
    await this.emit("session_started", { message: initialMessage });

    while (!this.options.state.interrupted) {
      let toolUsed = false;
      let assistantText = "";

      for await (const chunk of this.options.model.stream(
        this.options.state.messages,
        agentToolDefinitions,
      )) {
        if (chunk.type === "text" && chunk.text) {
          assistantText += chunk.text;
          await this.emit("assistant_message", { text: chunk.text });
        }

        if (chunk.type !== "tool_call" || !chunk.toolCall) continue;

        toolUsed = true;
        const call = chunk.toolCall;
        await this.emit("tool_call", { toolCall: call });

        const definition = agentToolDefinitions.find((item) => item.name === call.name);
        if (definition?.requiresPermission && !this.alwaysAllowedTools.has(call.name)) {
          const request: AgentPermissionRequest = {
            id: call.id,
            tool: call.name,
            scope: call.name,
            reason: "Agent requested a workspace-changing operation.",
            metadata: call.arguments,
          };

          this.options.state.pendingPermission = request;
          await this.emit("permission_requested", { request, permissionId: request.id });

          const decision = await this.waitForPermission(request);
          this.options.state.pendingPermission = undefined;

          if (decision === "reject") {
            const result: AgentToolResult = {
              toolCallId: call.id,
              name: call.name,
              ok: false,
              output: null,
              error: "Permission denied by the user.",
            };
            await this.emit("permission_resolved", {
              permissionId: request.id,
              decision,
              tool: call.name,
            });
            await this.emit("tool_result", { result });
            this.options.state.messages.push({
              role: "assistant",
              content: JSON.stringify({ toolCall: call, result }),
            });
            continue;
          }

          if (decision === "always") {
            this.alwaysAllowedTools.add(call.name);
          }

          await this.emit("permission_resolved", {
            permissionId: request.id,
            decision,
            tool: call.name,
          });
        }

        const result = await this.options.executor.execute(this.options.state.session, call);
        await this.emit("tool_result", { result });
        this.options.state.messages.push({
          role: "assistant",
          content: JSON.stringify({ toolCall: call, result }),
        });
      }

      if (assistantText) {
        this.options.state.messages.push({ role: "assistant", content: assistantText });
      }

      if (!toolUsed) {
        await this.emit("run_completed", { reason: "model_completed" });
        return;
      }
    }

    await this.emit("run_interrupted", {});
  }

  resolvePermission(requestId: string, decision: AgentPermissionDecision): void {
    const pending = this.pendingPermissions.get(requestId);
    if (!pending) {
      throw new Error(`No pending permission request found for ${requestId}`);
    }

    this.pendingPermissions.delete(requestId);
    pending.resolve(decision);
  }

  private waitForPermission(request: AgentPermissionRequest): Promise<AgentPermissionDecision> {
    return new Promise((resolve) => {
      this.pendingPermissions.set(request.id, { request, resolve });
    });
  }

  private async emit(type: AgentEvent["type"], payload: Record<string, unknown>): Promise<void> {
    if (!agentEventTypes.includes(type)) return;
    await this.options.emit({
      id: crypto.randomUUID(),
      runId: this.options.state.session.runId,
      type,
      sequence: this.sequence++,
      payload,
      createdAt: new Date(),
    });
  }
}
