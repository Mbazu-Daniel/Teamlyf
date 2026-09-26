import { spawn } from "node:child_process";
import type { AgentSandbox, SandboxLimits, SandboxOptions } from "./sandbox";
import {
  DEFAULT_SANDBOX_LIMITS,
  DEFAULT_SANDBOX_OPTIONS,
  validateSandboxLimits,
} from "./sandbox";
import type { CommandResult, WorkspaceHandle } from "./workspace";

const WORKSPACE_MOUNT = "/workspace";
const CONTAINER_TIMEOUT_COMMAND = "/usr/bin/timeout";
const TEMPFS_SIZE = "64m";

export class DockerAgentSandbox implements AgentSandbox {
  private readonly options: SandboxOptions;

  constructor(options: Partial<SandboxOptions> = {}) {
    if (options.network && options.network !== "none") {
      throw new Error("Agent sandboxes must use isolated networking");
    }

    const limits = validateSandboxLimits({
      ...DEFAULT_SANDBOX_LIMITS,
      ...options.limits,
    });

    this.options = {
      ...DEFAULT_SANDBOX_OPTIONS,
      ...options,
      network: "none",
      limits,
    };
  }

  async start(workspace: WorkspaceHandle): Promise<void> {
    const name = this.containerName(workspace);
    try {
      await this.runDocker([
        "create",
        ...this.containerOptions(workspace),
        "sleep",
        "infinity",
      ]);
      await this.runDocker(["start", name]);
    } catch (error) {
      await this.runDocker(["rm", "-f", name]).catch(() => undefined);
      throw error;
    }
  }

  async run(
    workspace: WorkspaceHandle,
    command: string,
    args: readonly string[] = [],
    options: Partial<SandboxLimits> = {},
  ): Promise<CommandResult> {
    if (!command.trim()) throw new Error("Sandbox command must not be empty");

    const limits = validateSandboxLimits({
      ...this.options.limits,
      ...options,
    });
    const timeout = (limits.timeoutMs / 1000).toFixed(3) + "s";

    return this.runDockerCommand(
      [
        "exec",
        this.containerName(workspace),
        CONTAINER_TIMEOUT_COMMAND,
        "--signal=TERM",
        "--kill-after=1s",
        timeout,
        command,
        ...args,
      ],
      limits,
    );
  }

  async stop(workspace: WorkspaceHandle): Promise<void> {
    await this.runDocker(["rm", "-f", this.containerName(workspace)]);
  }

  private containerOptions(workspace: WorkspaceHandle): string[] {
    const limits = this.options.limits;

    return [
      "--name",
      this.containerName(workspace),
      "--rm",
      "--cap-drop",
      "ALL",
      "--security-opt",
      "no-new-privileges:true",
      "--read-only",
      "--pids-limit",
      String(limits.pidsLimit),
      "--memory",
      limits.memoryMb + "m",
      "--memory-swap",
      limits.memoryMb + "m",
      "--cpus",
      String(limits.cpuCount),
      "--network",
      "none",
      "--ipc",
      "none",
      "--init",
      "--tmpfs",
      "/tmp:rw,noexec,nosuid,nodev,size=" + TEMPFS_SIZE,
      "--shm-size",
      "64m",
      "--env",
      "HOME=/tmp",
      "--env",
      "TMPDIR=/tmp",
      "--mount",
      "type=bind,src=" + workspace.root + ",dst=" + WORKSPACE_MOUNT,
      "--workdir",
      WORKSPACE_MOUNT,
      "--user",
      "1000:1000",
      this.options.image,
    ];
  }

  private containerName(workspace: WorkspaceHandle): string {
    const suffix = workspace.root.split("/").pop();
    if (!suffix) throw new Error("Workspace root must have a container-safe path");
    return "teamlyf-agent-" + suffix;
  }

  private runDockerCommand(
    args: readonly string[],
    limits: SandboxLimits,
  ): Promise<CommandResult> {
    return runProcess("docker", args, limits.timeoutMs + 5_000, limits.maxOutputBytes);
  }

  private runDocker(args: readonly string[]): Promise<CommandResult> {
    return runProcess(
      "docker",
      args,
      this.options.limits.timeoutMs,
      this.options.limits.maxOutputBytes,
    ).then((result) => {
      if (result.exitCode !== 0) {
        throw new Error(result.stderr || "Docker command failed");
      }
      return result;
    });
  }
}

function runProcess(
  command: string,
  args: readonly string[],
  timeoutMs: number,
  maxOutputBytes: number,
): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, [...args], { shell: false });
    let stdout = "";
    let stderr = "";
    let totalBytes = 0;
    let settled = false;

    const timer = setTimeout(() => {
      finishError(new Error("Sandbox command timed out after " + timeoutMs + "ms"));
    }, timeoutMs);

    const finishError = (error: unknown) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.kill("SIGKILL");
      reject(error);
    };

    const append = (current: string, chunk: Buffer): string => {
      totalBytes += chunk.byteLength;
      if (totalBytes > maxOutputBytes) {
        throw new Error("Sandbox output exceeded the configured limit");
      }
      return current + chunk.toString("utf8");
    };

    child.stdout.on("data", (chunk: Buffer) => {
      try {
        stdout = append(stdout, chunk);
      } catch (error) {
        finishError(error);
      }
    });
    child.stderr.on("data", (chunk: Buffer) => {
      try {
        stderr = append(stderr, chunk);
      } catch (error) {
        finishError(error);
      }
    });
    child.on("error", finishError);
    child.on("close", (exitCode) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ exitCode: exitCode ?? -1, stdout, stderr });
    });
  });
}
