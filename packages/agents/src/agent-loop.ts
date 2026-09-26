import {
  type AgentEvent,
  type AgentMessage,
  type AgentModel,
  type AgentPermissionDecision,
  type AgentRuntimeState,
  type AgentToolExecutor,
  agentEventTypes,
} from "./index";
import { agentToolDefinitions } from "./tool-definitions";

export type AgentLoopOptions = {
  state: AgentRuntimeState;
  model: AgentModel;
  executor: AgentToolExecutor;
  emit: (event: AgentEvent) => Promise<void> | void;
};

export class AgentLoop {
  private sequence = 0;

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
        if (chunk.type === "tool_call" && chunk.toolCall) {
          toolUsed = true;
          const call = chunk.toolCall;
          await this.emit("tool_call", { toolCall: call });

          const definition = agentToolDefinitions.find((item) => item.name === call.name);
          if (definition?.requiresPermission) {
            await this.emit("permission_requested", {
              request: { id: call.id, tool: call.name, scope: call.name, reason: "Agent requested a workspace-changing operation.", metadata: call.arguments },
            });
          }

          const result = await this.options.executor.execute(this.options.state.session, call);
          await this.emit("tool_result", { result });
          this.options.state.messages.push({
            role: "assistant",
            content: JSON.stringify({ toolCall: call, result }),
          });
        }
      }

      if (assistantText) this.options.state.messages.push({ role: "assistant", content: assistantText });
      if (!toolUsed) {
        await this.emit("run_completed", { reason: "model_completed" });
        return;
      }
    }

    await this.emit("run_interrupted", {});
  }

  resolvePermission(_requestId: string, _decision: AgentPermissionDecision): void {
    this.options.state.pendingPermission = undefined;
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
