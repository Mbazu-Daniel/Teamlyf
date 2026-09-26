import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";
import {
  createWorkspaceRoot,
  removeWorkspaceRoot,
  type CommandResult,
  type WorkspaceCommandRunner,
  type WorkspaceHandle,
  type WorkspaceManager,
  type WorkspaceSpec,
} from "./workspace";

const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_MAX_OUTPUT_BYTES = 256 * 1024;

export class LocalWorkspaceManager implements WorkspaceManager {
  async provision(spec: WorkspaceSpec): Promise<WorkspaceHandle> {
    const root = await createWorkspaceRoot();
    try {
      await runProcess(
        "git",
        [
          "clone",
          "--no-tags",
          "--depth",
          "1",
          "--branch",
          spec.baseBranch,
          "https://github.com/" + spec.repository + ".git",
          root,
        ],
        DEFAULT_TIMEOUT_MS,
        DEFAULT_MAX_OUTPUT_BYTES,
      );
      await runProcess(
        "git",
        ["checkout", "-b", spec.workingBranch],
        DEFAULT_TIMEOUT_MS,
        DEFAULT_MAX_OUTPUT_BYTES,
        root,
      );
      return { ...spec, root };
    } catch (error) {
      await removeWorkspaceRoot(root);
      throw error;
    }
  }

  async cleanup(workspace: WorkspaceHandle): Promise<void> {
    await rm(workspace.root, { recursive: true, force: true });
  }
}

export class LocalWorkspaceCommandRunner implements WorkspaceCommandRunner {
  async run(
    workspace: WorkspaceHandle,
    command: string,
    args: readonly string[] = [],
    options: { timeoutMs?: number; maxOutputBytes?: number } = {},
  ): Promise<CommandResult> {
    return runProcess(
      command,
      args,
      options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      options.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES,
      workspace.root,
    );
  }
}

async function runProcess(
  command: string,
  args: readonly string[],
  timeoutMs: number,
  maxOutputBytes: number,
  cwd?: string,
): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, [...args], { cwd, shell: false });
    let stdout = "";
    let stderr = "";
    let totalBytes = 0;
    let settled = false;

    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    };

    const append = (current: string, chunk: Buffer): string => {
      totalBytes += chunk.byteLength;
      if (totalBytes > maxOutputBytes) {
        child.kill("SIGTERM");
        throw new Error("Command output exceeded the configured limit");
      }
      return current + chunk.toString("utf8");
    };

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      fail(new Error("Command timed out after " + timeoutMs + "ms"));
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      try { stdout = append(stdout, chunk); } catch (error) { fail(error); }
    });
    child.stderr.on("data", (chunk: Buffer) => {
      try { stderr = append(stderr, chunk); } catch (error) { fail(error); }
    });
    child.on("error", fail);
    child.on("close", (exitCode) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ exitCode: exitCode ?? -1, stdout, stderr });
    });
  });
}
