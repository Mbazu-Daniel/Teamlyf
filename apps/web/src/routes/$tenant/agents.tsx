import { useState, type FormEvent } from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import {
  IconCheck,
  IconLock,
  IconPlus,
  IconRobot,
  IconX,
} from "@tabler/icons-react";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/workspace-ui";
import { AppDialog } from "@/components/app-dialog";
import { ResourceState } from "@/components/resource-state";
import { api, organizationPath, useApiResource } from "@/lib/api";
type Agent = {
  id: string;
  name: string;
  capabilityType: string;
  toolGrants: string;
  status: string;
  createdAt: string;
};
type AgentTask = {
  id: string;
  agentId: string;
  sourceType: string;
  status: string;
  approvalStatus: string;
  input: string;
  createdAt: string;
};
export const Route = createFileRoute("/$tenant/agents")({ component: Agents });
function Agents() {
  const { tenant } = useParams({ strict: false }) as { tenant: string };
  const agents = useApiResource<Agent[]>(organizationPath(tenant, "/agents"));
  const tasks = useApiResource<AgentTask[]>(
    organizationPath(tenant, "/agents/tasks"),
  );
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Agent | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const agentById = new Map(
    (agents.data ?? []).map((agent) => [agent.id, agent]),
  );
  const audit = useApiResource<Array<{ id: string; action: string; createdAt: string }>>(selected ? organizationPath(tenant, `/agents/${selected.id}/audit`) : null);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await api(organizationPath(tenant, "/agents"), {
        method: "POST",
        body: JSON.stringify({
          name: String(form.get("name")),
          capabilityType: String(form.get("capabilityType")),
          toolGrants: String(form.get("toolGrants") || "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        }),
      });
      setOpen(false);
      await agents.reload();
    } catch (reason) {
      setMessage(
        reason instanceof Error ? reason.message : "Unable to create agent",
      );
    } finally {
      setBusy(false);
    }
  }
  async function decide(task: AgentTask, approved: boolean) {
    try {
      await api(organizationPath(tenant, `/agents/tasks/${task.id}/approval`), {
        method: "POST",
        body: JSON.stringify({ approved }),
      });
      await tasks.reload();
    } catch (reason) {
      setMessage(
        reason instanceof Error ? reason.message : "Unable to record approval",
      );
    }
  }
  async function update(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!selected) return; const form = new FormData(event.currentTarget); setBusy(true); try { await api(organizationPath(tenant, `/agents/${selected.id}`), { method: "PATCH", body: JSON.stringify({ name: String(form.get("name")), capabilityType: String(form.get("capabilityType")), status: String(form.get("status")), toolGrants: String(form.get("toolGrants") || "").split(",").map((item) => item.trim()).filter(Boolean) }) }); setSelected(null); await agents.reload(); } catch (reason) { setMessage(reason instanceof Error ? reason.message : "Unable to update agent"); } finally { setBusy(false); } }
  return (
    <>
      <PageHeader
        title="Agents"
        description="Configure purpose-built agents, inspect their scope, and keep meaningful actions behind human approval."
        action={
          <button
            onClick={() => setOpen(true)}
            className="flex h-9 items-center gap-1.5 rounded-xl bg-violet-600 px-3 text-sm font-semibold text-white"
          >
            <IconPlus className="size-4" />
            Create agent
          </button>
        }
      />
      <ResourceState
        loading={agents.loading}
        error={agents.error}
        onRetry={agents.reload}
        isEmpty={agents.data?.length === 0}
        emptyTitle="Create your first agent"
        emptyCopy="Give it a clear capability and the smallest set of tools it needs."
      >
        {agents.data && (
          <section className="grid gap-4 lg:grid-cols-3">
            {agents.data.map((agent) => (
              <button key={agent.id} onClick={() => setSelected(agent)} className="surface rounded-2xl p-5 text-left transition hover:border-violet-300 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <span className="grid size-11 place-items-center rounded-xl bg-violet-100 text-violet-700">
                    <IconRobot className="size-5" />
                  </span>
                  <StatusPill
                    tone={agent.status === "active" ? "green" : "amber"}
                  >
                    {agent.status}
                  </StatusPill>
                </div>
                <h2 className="mt-5 font-semibold">{agent.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {agent.capabilityType}
                </p>
                <div className="mt-5 border-t pt-4">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Tool grants
                  </p>
                  <p className="mt-1 text-sm">
                    {JSON.parse(agent.toolGrants || "[]").join(", ") ||
                      "No tools granted"}
                  </p>
                  <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                    <IconLock className="size-3.5" />
                    Scoped to this workspace
                  </p>
                </div>
              </button>
            ))}
          </section>
        )}
      </ResourceState>
      <section className="surface mt-6 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Approval queue</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Only actions waiting for a teammate can be approved or rejected.
            </p>
          </div>
          <StatusPill tone="amber">
            {
              (tasks.data ?? []).filter(
                (task) => task.status === "awaiting_approval",
              ).length
            }{" "}
            pending
          </StatusPill>
        </div>
        <ResourceState
          loading={tasks.loading}
          error={tasks.error}
          onRetry={tasks.reload}
          isEmpty={tasks.data?.length === 0}
          emptyTitle="No agent activity yet"
        >
          {tasks.data && (
            <div className="mt-5 divide-y rounded-xl border bg-white px-4">
              {tasks.data.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      {agentById.get(task.agentId)?.name ?? "Agent"} ·{" "}
                      {task.sourceType}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {task.status.replaceAll("_", " ")} ·{" "}
                      {new Date(task.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {task.status === "awaiting_approval" ? (
                    <span className="flex gap-2">
                      <button
                        onClick={() => void decide(task, true)}
                        className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1.5 text-xs font-semibold text-white"
                      >
                        <IconCheck className="size-3.5" />
                        Approve
                      </button>
                      <button
                        onClick={() => void decide(task, false)}
                        className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold"
                      >
                        <IconX className="size-3.5" />
                        Reject
                      </button>
                    </span>
                  ) : (
                    <StatusPill
                      tone={task.status === "completed" ? "green" : "slate"}
                    >
                      {task.status}
                    </StatusPill>
                  )}
                </div>
              ))}
            </div>
          )}
        </ResourceState>
      </section>
      {message && <p className="mt-4 text-sm text-rose-700">{message}</p>}
      {open && (
        <AppDialog
          title="Create agent"
          description="Make its scope explicit before it has access to any work."
          onClose={() => setOpen(false)}
        >
          <form onSubmit={create} className="space-y-4">
            <label className="block text-sm font-semibold">
              Name
              <input
                name="name"
                required
                className="mt-1.5 h-10 w-full rounded-xl border px-3 text-sm"
              />
            </label>
            <label className="block text-sm font-semibold">
              Capability
              <input
                name="capabilityType"
                required
                placeholder="e.g. release coordination"
                className="mt-1.5 h-10 w-full rounded-xl border px-3 text-sm"
              />
            </label>
            <label className="block text-sm font-semibold">
              Tool grants
              <input
                name="toolGrants"
                placeholder="tasks.read, docs.read"
                className="mt-1.5 h-10 w-full rounded-xl border px-3 text-sm"
              />
            </label>
            <button
              disabled={busy}
              className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white"
            >
              {busy ? "Creating…" : "Create agent"}
            </button>
          </form>
        </AppDialog>
      )}
      {selected && <AppDialog title={`Configure ${selected.name}`} description="Edit this agent’s capability, availability, and tool grants. Its audit trail is shown below." onClose={() => setSelected(null)}><form onSubmit={update} className="space-y-3"><label className="block text-sm font-semibold">Name<input name="name" defaultValue={selected.name} className="mt-1.5 h-10 w-full rounded-xl border px-3 text-sm" /></label><label className="block text-sm font-semibold">Capability<input name="capabilityType" defaultValue={selected.capabilityType} className="mt-1.5 h-10 w-full rounded-xl border px-3 text-sm" /></label><label className="block text-sm font-semibold">Status<select name="status" defaultValue={selected.status} className="mt-1.5 h-10 w-full rounded-xl border bg-white px-3 text-sm"><option value="active">Active</option><option value="paused">Paused</option></select></label><label className="block text-sm font-semibold">Tool grants<input name="toolGrants" defaultValue={JSON.parse(selected.toolGrants || "[]").join(", ")} className="mt-1.5 h-10 w-full rounded-xl border px-3 text-sm" /></label><button disabled={busy} className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white">Save agent</button></form><div className="mt-5 border-t pt-4"><p className="eyebrow mb-2">Audit history</p><ResourceState loading={audit.loading} error={audit.error} onRetry={audit.reload} isEmpty={audit.data?.length === 0} emptyTitle="No audit records yet">{audit.data && <div className="space-y-2">{audit.data.map((entry) => <p key={entry.id} className="rounded-lg bg-muted p-2 text-xs"><strong>{entry.action}</strong> · {new Date(entry.createdAt).toLocaleString()}</p>)}</div>}</ResourceState></div></AppDialog>}
    </>
  );
}
