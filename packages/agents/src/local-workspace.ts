import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { chmod, rm, writeFile } from "node:fs/promises";
import {
  createWorkspaceRoot,
  removeWorkspaceRoot,
  type CommandResult,
  type WorkspaceCommandRunner,
  type WorkspaceHandle,
  type WorkspaceManager,
  type WorkspaceSpec,
  type WorkspaceGitCredentials,
} from "./workspace";

const DEFAULT_TIMEOUT_MS = 120_000;
const DEFAULT_MAX_OUTPUT_BYTES = 256 * 1024;

export class LocalWorkspaceManager implements WorkspaceManager {
  constructor(private readonly credentials?: WorkspaceGitCredentials) {}
  async provision(spec: WorkspaceSpec): Promise<WorkspaceHandle> {
    const root = await createWorkspaceRoot();
    try {
      const askpass = this.credentials ? await createAskpass() : undefined;
      try {
        const token = this.credentials ? await this.credentials.getToken(spec.repository) : undefined;
        await runProcess(
          "git",
          [
            ...(token ? ["-c", "credential.helper="] : []),
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
          undefined,
          askpass ? { GIT_ASKPASS: askpass, GIT_TERMINAL_PROMPT: "0", TEAMLYF_GIT_TOKEN: token ?? "" } : undefined,
        );
      } finally {
        if (askpass) await rm(askpass, { force: true });
      }
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
  env?: Record<string, string>,
): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, [...args], { cwd, shell: false, env: { ...process.env, ...env } });
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


async function createAskpass(): Promise<string> {
  const path = tmpdir() + "/teamlyf-git-askpass-" + process.pid + "-" + Date.now();
  await writeFile(
    path,
    '#!/bin/sh\nif [ "$1" = "Username for *" ]; then echo x-access-token; else printf "%s" "$TEAMLYF_GIT_TOKEN"; fi\n',
    { mode: 0o700 },
  );
  await chmod(path, 0o700);
  return path;
}
