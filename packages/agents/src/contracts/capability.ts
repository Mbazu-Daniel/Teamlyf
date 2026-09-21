export type AgentModule = "pm" | "chat" | "docs" | "notes" | "hr" | "billing";

export type AgentAction = {
  module: AgentModule;
  action: string;
  resourceId?: string;
};

export type AgentCapability = {
  name: string;
  description: string;
  actions: readonly AgentAction[];
};