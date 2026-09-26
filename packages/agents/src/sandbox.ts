import type { CommandResult, WorkspaceHandle } from "./workspace";

export type SandboxLimits = {
  timeoutMs: number;
  maxOutputBytes: number;
  memoryMb: number;
  cpuCount: number;
  pidsLimit: number;
};

export type SandboxOptions = {
  image: string;
  network: "none" | "host";
  limits: SandboxLimits;
};

export interface AgentSandbox {
  start(workspace: WorkspaceHandle): Promise<void>;
  run(
    workspace: WorkspaceHandle,
    command: string,
    args?: readonly string[],
    options?: Partial<SandboxLimits>,
  ): Promise<CommandResult>;
  stop(workspace: WorkspaceHandle): Promise<void>;
}

export const DEFAULT_SANDBOX_LIMITS: SandboxLimits = {
  timeoutMs: 120_000,
  maxOutputBytes: 256 * 1024,
  memoryMb: 1_024,
  cpuCount: 2,
  pidsLimit: 256,
};

export const DEFAULT_SANDBOX_OPTIONS: SandboxOptions = {
  image: "node:24-bookworm-slim",
  network: "none",
  limits: DEFAULT_SANDBOX_LIMITS,
};
