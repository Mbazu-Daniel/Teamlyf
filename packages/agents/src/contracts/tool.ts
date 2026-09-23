import type { AgentContext } from "./context";

export type AgentTool<Input = unknown, Output = unknown> = {
  name: string;
  description: string;
  execute(input: Input, context: AgentContext): Promise<Output>;
};