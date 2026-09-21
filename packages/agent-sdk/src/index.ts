import type { AgentTaskEnvelope } from "@teamlyf/types";

export type AgentToolContext = {
  organizationId: string;
  agentId: string;
  taskId: string;
  credentials: Record<string, string>;
  signal?: AbortSignal;
};

export type AgentTool<I = unknown, O = unknown> = {
  name: string;
  module: string;
  action: string;
  requiresApproval?: boolean;
  execute(input: I, context: AgentToolContext): Promise<O>;
};

export type AgentCapability = {
  type: string;
  tools: readonly AgentTool[];
};

export type AgentExecutionResult = {
  output: Record<string, unknown>;
  toolCalls: Array<{ name: string; module: string; action: string }>;
  requiresApproval: boolean;
};

export interface CapabilityRegistry {
  get(type: string): AgentCapability | undefined;
  register(capability: AgentCapability): void;
}

export class InMemoryCapabilityRegistry implements CapabilityRegistry {
  private readonly capabilities = new Map<string, AgentCapability>();

  get(type: string): AgentCapability | undefined {
    return this.capabilities.get(type);
  }

  register(capability: AgentCapability): void {
    if (this.capabilities.has(capability.type)) {
      throw new Error(`Agent capability already registered: ${capability.type}`);
    }
    this.capabilities.set(capability.type, capability);
  }
}

export type AgentTaskHandler = (task: AgentTaskEnvelope) => Promise<AgentExecutionResult>;
