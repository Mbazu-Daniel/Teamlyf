import type { AgentSession, AgentToolCall, AgentToolName, AgentToolResult } from "./contracts";
import type { AgentToolExecutor } from "./runtime";

export type AgentToolHandler = (session: AgentSession, call: AgentToolCall) => Promise<unknown>;
export type AgentToolRegistration = { name: AgentToolName; handler: AgentToolHandler };

export class AgentToolRegistry implements AgentToolExecutor {
  private readonly handlers = new Map<AgentToolName, AgentToolHandler>();

  constructor(registrations: readonly AgentToolRegistration[] = []) {
    for (const registration of registrations) this.register(registration);
  }

  register(registration: AgentToolRegistration): this {
    this.handlers.set(registration.name, registration.handler);
    return this;
  }

  has(name: AgentToolName): boolean {
    return this.handlers.has(name);
  }

  async execute(session: AgentSession, call: AgentToolCall): Promise<AgentToolResult> {
    const handler = this.handlers.get(call.name);
    if (!handler) {
      return { toolCallId: call.id, name: call.name, ok: false, output: null,
        error: `Tool '${call.name}' is not available in this agent context.` };
    }
    try {
      return { toolCallId: call.id, name: call.name, ok: true, output: await handler(session, call) };
    } catch (error) {
      return { toolCallId: call.id, name: call.name, ok: false, output: null,
        error: error instanceof Error ? error.message : String(error) };
    }
  }
}
