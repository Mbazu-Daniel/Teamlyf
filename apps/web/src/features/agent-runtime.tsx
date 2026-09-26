import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconArrowLeft,
  IconCheck,
  IconLoader2,
  IconPlayerPause,
  IconPlayerPlay,
  IconRefresh,
  IconRobot,
  IconSend,
  IconShieldCheck,
  IconShieldX,
  IconTool,
  IconX,
} from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { agentsApi, agentRuntimeApi, type AgentEvent, type AgentPermissionPolicy, type AgentRun } from "@/lib/api";
import { useOrganization } from "@/lib/organization";
import { getErrorMessage } from "@/lib/error-message";

type PermissionRequest = {
  id: string;
  tool: string;
  reason: string;
  metadata: Record<string, unknown>;
};

export function AgentRuntimePage({ agentId }: { agentId: string }) {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const [runId, setRunId] = useState<string | null>(null);
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [message, setMessage] = useState("");
  const [permission, setPermission] = useState<PermissionRequest | null>(null);
  const [runtimeStatus, setRuntimeStatus] = useState<string>("idle");

  const organizationId = organization?.id ?? "";
  const agentQuery = useQuery({
    queryKey: ["agent", organizationId, agentId],
    queryFn: () => agentsApi.list(organizationId),
    enabled: Boolean(organizationId),
    select: (agents) => agents.find((agent) => agent.id === agentId),
  });
  const runsQuery = useQuery({
    queryKey: ["agent-runs", organizationId, agentId],
    queryFn: () => agentsApi.runs(organizationId, agentId),
    enabled: Boolean(organizationId),
  });
  const permissionsQuery = useQuery<AgentPermissionPolicy[]>({
    queryKey: ["agent-permissions", organizationId, agentId],
    queryFn: () => agentsApi.permissions(organizationId, agentId),
    enabled: Boolean(organizationId),
  });

  useEffect(() => {
    const latest = runsQuery.data?.[0];
    if (latest && !runId) {
      setRunId(latest.id);
      setRuntimeStatus(latest.status);
    }
  }, [runsQuery.data, runId]);

  useEffect(() => {
    if (!organizationId || !runId) return;
    setEvents([]);
    setPermission(null);
    const source = agentRuntimeApi.events(organizationId, runId);
    const onEvent = (event: MessageEvent<string>) => {
      const next = JSON.parse(event.data) as AgentEvent;
      setEvents((current) => [...current, next]);
      if (next.type === "permission_requested") {
        const request = next.payload.request;
        if (isPermissionRequest(request)) setPermission(request);
        setRuntimeStatus("waiting_for_permission");
      }
      if (next.type === "permission_resolved") setPermission(null);
      if (next.type === "run_completed") setRuntimeStatus("completed");
      if (next.type === "run_interrupted") setRuntimeStatus("interrupted");
      if (next.type === "run_failed") setRuntimeStatus("failed");
    };
    source.onmessage = onEvent;
    source.onerror = () => undefined;
    return () => source.close();
  }, [organizationId, runId]);

  const createRunMutation = useMutation({
    mutationFn: () => agentsApi.run(organizationId, agentId, { contextType: "organization" }),
    onSuccess: (run) => {
      setRunId(run.id);
      setRuntimeStatus(run.status);
      void queryClient.invalidateQueries({ queryKey: ["agent-runs", organizationId, agentId] });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      let currentRunId = runId;
      if (!currentRunId) {
        const run = await agentsApi.run(organizationId, agentId, { contextType: "organization" });
        currentRunId = run.id;
        setRunId(run.id);
      }
      setRuntimeStatus("running");
      return agentRuntimeApi.sendMessage(organizationId, currentRunId, text);
    },
    onSuccess: () => {
      setMessage("");
      void queryClient.invalidateQueries({ queryKey: ["agent-runs", organizationId, agentId] });
    },
  });

  const interruptMutation = useMutation({
    mutationFn: () => agentRuntimeApi.interrupt(organizationId, runId!),
    onSuccess: () => setRuntimeStatus("interrupted"),
  });

  const resumeMutation = useMutation({
    mutationFn: () => agentRuntimeApi.resume(organizationId, runId!),
    onSuccess: (result) => setRuntimeStatus(result.resumed ? "running" : "waiting_for_permission"),
  });

  const permissionMutation = useMutation({
    mutationFn: (decision: "once" | "always" | "reject") =>
      agentRuntimeApi.resolvePermission(organizationId, runId!, permission!.id, decision),
    onSuccess: (result) => {
      setPermission(null);
      setRuntimeStatus("running");
      if (result.decision === "always") {
        void queryClient.invalidateQueries({ queryKey: ["agent-permissions", organizationId, agentId] });
      }
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (tool: string) => agentsApi.revokePermission(organizationId, agentId, tool),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["agent-permissions", organizationId, agentId] }),
  });

  const visibleEvents = useMemo(() => events.filter((event) =>
    ["assistant_message", "tool_call", "tool_result", "permission_resolved"].includes(event.type),
  ), [events]);

  const error = getErrorMessage(
    agentQuery.error ?? runsQuery.error ?? sendMutation.error ?? permissionMutation.error ?? revokeMutation.error,
    "Unable to run the agent",
  );

  if (!organization) return <main className="p-6 text-sm text-muted-foreground">Select an organization first.</main>;
  if (!agentQuery.data) return <main className="p-6 text-sm text-muted-foreground">Agent not found.</main>;

  const agent = agentQuery.data;
  const run = runsQuery.data?.find((item) => item.id === runId);
  const busy = sendMutation.isPending || permissionMutation.isPending || resumeMutation.isPending;

  return (
    <main className="flex h-full min-h-0 flex-col bg-background">
      <header className="border-b px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/$organizationSlug/ai" params={{ organizationSlug: organization.slug ?? "" }} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
              <IconArrowLeft className="size-4" />
            </Link>
            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><IconRobot className="size-4" /></div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight">{agent.name}</h1>
              <p className="text-xs text-muted-foreground">{agent.description || "Organization agent"} · {formatStatus(runtimeStatus)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {runId && (runtimeStatus === "running" || runtimeStatus === "queued") && (
              <button type="button" onClick={() => interruptMutation.mutate()} disabled={interruptMutation.isPending} className="inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold hover:bg-muted">
                <IconPlayerPause className="size-4" /> Interrupt
              </button>
            )}
            {runId && (runtimeStatus === "interrupted" || runtimeStatus === "waiting_for_permission") && (
              <button type="button" onClick={() => resumeMutation.mutate()} disabled={resumeMutation.isPending} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground">
                {resumeMutation.isPending ? <IconLoader2 className="size-4 animate-spin" /> : <IconPlayerPlay className="size-4" />} Resume
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="flex min-h-0 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            {!runId && (
              <div className="rounded-xl border border-dashed p-10 text-center">
                <IconRobot className="mx-auto size-7 text-muted-foreground" />
                <h2 className="mt-3 text-sm font-semibold">Start a live run</h2>
                <p className="mt-1 text-xs text-muted-foreground">Send a message to start this agent in the organization context.</p>
              </div>
            )}

            {run && (
              <div className="mb-4 rounded-lg border bg-card px-3 py-2 text-xs text-muted-foreground">
                Run {run.id.slice(0, 8)} · {formatStatus(runtimeStatus)}
              </div>
            )}

            <div className="space-y-3">
              {visibleEvents.map((event) => <EventRow key={event.id} event={event} />)}
            </div>

            {permission && (
              <PermissionCard
                request={permission}
                busy={permissionMutation.isPending}
                onDecision={(decision) => permissionMutation.mutate(decision)}
              />
            )}

            {error && <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</p>}
          </div>

          <form
            className="border-t bg-card px-5 py-4 sm:px-6"
            onSubmit={(event) => {
              event.preventDefault();
              const text = message.trim();
              if (!text || busy || !agent.enabled) return;
              sendMutation.mutate(text);
            }}
          >
            <div className="flex gap-2">
              <input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={agent.enabled ? "Tell the agent what to do..." : "Agent is disabled"}
                disabled={!agent.enabled || busy}
                className="h-10 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
              <button type="submit" disabled={!message.trim() || !agent.enabled || busy} className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">
                {busy ? <IconLoader2 className="size-4 animate-spin" /> : <IconSend className="size-4" />} Send
              </button>
            </div>
          </form>
        </section>

        <aside className="min-h-0 overflow-y-auto border-t px-5 py-5 lg:border-l lg:border-t-0 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Always allowed</h2>
              <p className="mt-1 text-xs text-muted-foreground">Tools this agent can use without asking again.</p>
            </div>
            <button type="button" title="Refresh permissions" onClick={() => void permissionsQuery.refetch()} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><IconRefresh className="size-4" /></button>
          </div>

          <div className="mt-4 space-y-2">
            {(permissionsQuery.data ?? []).length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-xs text-muted-foreground">No durable permissions yet.</div>
            ) : (
              permissionsQuery.data!.map((policy) => (
                <div key={policy.id} className="flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <IconShieldCheck className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate text-xs font-medium">{policy.tool}</span>
                  </div>
                  <button type="button" title={"Revoke " + policy.tool} onClick={() => revokeMutation.mutate(policy.tool)} disabled={revokeMutation.isPending} className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                    <IconX className="size-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

function EventRow({ event }: { event: AgentEvent }) {
  const text = typeof event.payload.text === "string" ? event.payload.text : "";
  const toolCall = isRecord(event.payload.toolCall) ? event.payload.toolCall : undefined;
  const result = isRecord(event.payload.result) ? event.payload.result : undefined;
  if (event.type === "assistant_message") {
    return <div className="rounded-xl border bg-card p-4 text-sm leading-6">{text}</div>;
  }
  if (event.type === "tool_call") {
    const name = typeof toolCall?.name === "string" ? toolCall.name : "tool";
    return <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-xs"><IconTool className="size-3.5" /><span>Using <strong>{name}</strong></span></div>;
  }
  if (event.type === "tool_result") {
    const ok = result?.ok === true;
    return <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs">{ok ? <IconCheck className="size-3.5" /> : <IconShieldX className="size-3.5" />}<span>{ok ? "Tool completed" : "Tool failed"}</span></div>;
  }
  return <div className="rounded-lg border px-3 py-2 text-xs text-muted-foreground">Permission {event.type === "permission_resolved" ? "resolved" : "updated"}.</div>;
}

function PermissionCard({ request, busy, onDecision }: { request: PermissionRequest; busy: boolean; onDecision: (decision: "once" | "always" | "reject") => void }) {
  return (
    <div className="mt-4 rounded-xl border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><IconShieldCheck className="size-4" /></div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Permission required</h2>
          <p className="mt-1 text-xs text-muted-foreground">{request.reason}</p>
          <div className="mt-3 rounded-lg bg-muted/40 px-3 py-2 font-mono text-[11px]">{request.tool}</div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => onDecision("once")} disabled={busy} className="h-9 rounded-md border px-3 text-xs font-semibold hover:bg-muted">Allow once</button>
        <button type="button" onClick={() => onDecision("always")} disabled={busy} className="h-9 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-50">Always allow</button>
        <button type="button" onClick={() => onDecision("reject")} disabled={busy} className="h-9 rounded-md border border-destructive/30 px-3 text-xs font-semibold text-destructive hover:bg-destructive/5">Reject</button>
      </div>
    </div>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPermissionRequest(value: unknown): value is PermissionRequest {
  if (!isRecord(value)) return false;
  return typeof value.id === "string" && typeof value.tool === "string" && typeof value.reason === "string" && isRecord(value.metadata);
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}
