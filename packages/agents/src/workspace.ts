import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";

export type WorkspaceSpec = {
  repository: string;
  baseBranch: string;
  workingBranch: string;
};

export type WorkspaceHandle = WorkspaceSpec & { root: string };

export type CommandResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

export interface WorkspaceGitCredentials {
  getToken(repository: string): Promise<string>;
}

export interface WorkspaceManager {
  provision(spec: WorkspaceSpec): Promise<WorkspaceHandle>;
  cleanup(workspace: WorkspaceHandle): Promise<void>;
}

export interface WorkspaceCommandRunner {
  run(
    workspace: WorkspaceHandle,
    command: string,
    args?: readonly string[],
    options?: { timeoutMs?: number; maxOutputBytes?: number },
  ): Promise<CommandResult>;
}

export function resolveWorkspacePath(root: string, requestedPath: string): string {
  const workspaceRoot = resolve(root);
  const candidate = resolve(workspaceRoot, requestedPath);
  if (candidate !== workspaceRoot && !candidate.startsWith(workspaceRoot + sep)) {
    throw new Error("Path escapes the agent workspace");
  }
  return candidate;
}

export async function createWorkspaceRoot(prefix = "teamlyf-agent-"): Promise<string> {
  await mkdir(tmpdir(), { recursive: true });
  return mkdtemp(join(tmpdir(), prefix));
}

export async function removeWorkspaceRoot(root: string): Promise<void> {
  await rm(root, { recursive: true, force: true });
}
