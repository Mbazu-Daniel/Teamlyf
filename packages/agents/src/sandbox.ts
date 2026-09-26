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
  network: "none";
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

export function validateSandboxLimits(
  limits: SandboxLimits,
): SandboxLimits {
  const fields: Array<[keyof SandboxLimits, number]> = [
    ["timeoutMs", limits.timeoutMs],
    ["maxOutputBytes", limits.maxOutputBytes],
    ["memoryMb", limits.memoryMb],
    ["cpuCount", limits.cpuCount],
    ["pidsLimit", limits.pidsLimit],
  ];

  for (const [name, value] of fields) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error(`Sandbox limit '${name}' must be a positive number`);
    }
  }

  return {
    timeoutMs: Math.ceil(limits.timeoutMs),
    maxOutputBytes: Math.ceil(limits.maxOutputBytes),
    memoryMb: Math.ceil(limits.memoryMb),
    cpuCount: limits.cpuCount,
    pidsLimit: Math.ceil(limits.pidsLimit),
  };
}
