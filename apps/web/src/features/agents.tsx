import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconPlus, IconRobot, IconTrash, IconPlayerPause, IconPlayerPlay } from "@tabler/icons-react";
import { agentsApi, type Agent } from "@/lib/api";
import { useOrganization } from "@/lib/organization";
import { getErrorMessage } from "@/lib/error-message";

// fallow-ignore-next-line complexity -- organization agent management combines loading, creation, mutation and empty states in one page component
export function AgentsPage() {
  const { organization } = useOrganization();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const organizationId = organization?.id ?? "";
  const agentsKey = ["agents", organizationId] as const;
  const agentsQuery = useQuery({
    queryKey: agentsKey,
    queryFn: () => agentsApi.list(organizationId),
    enabled: Boolean(organizationId),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: () => agentsApi.create(organizationId, { name: name.trim(), description: description.trim() || undefined }),
    onSuccess: (agent) => {
      queryClient.setQueryData<Agent[]>(agentsKey, (current) => [...(current ?? []), agent]);
      setName("");
      setDescription("");
      setCreating(false);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: agentsKey }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => agentsApi.update(organizationId, id, { enabled }),
    onSuccess: (agent) => queryClient.setQueryData<Agent[]>(agentsKey, (current) => (current ?? []).map((item) => item.id === agent.id ? agent : item)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => agentsApi.delete(organizationId, id),
    onSuccess: (_, id) => queryClient.setQueryData<Agent[]>(agentsKey, (current) => (current ?? []).filter((item) => item.id !== id)),
  });

  const error = getErrorMessage(agentsQuery.error ?? createMutation.error ?? updateMutation.error ?? deleteMutation.error, "Unable to update agents");

  if (!organization) {
    return <main className="p-6 text-sm text-muted-foreground">Select an organization first.</main>;
  }

  const agents = agentsQuery.data ?? [];

  return (
    <main className="flex h-full min-h-0 flex-col bg-background">
      <header className="border-b px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary"><IconRobot className="size-4" /></div>
              <h1 className="text-lg font-semibold tracking-tight">AI agents</h1>
            </div>
            <p className="mt-1 max-w-2xl text-xs text-muted-foreground">Create organization-level agents that can work across Teamlyf.</p>
          </div>
          <button type="button" onClick={() => setCreating((value) => !value)} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground">
            <IconPlus className="size-4" /> {creating ? "Close" : "Create agent"}
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        {creating && (
          <form onSubmit={(event) => { event.preventDefault(); if (!name.trim() || createMutation.isPending) return; createMutation.mutate(); }} className="mb-5 rounded-xl border bg-card p-4">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Agent name" className="h-10 rounded-lg border bg-background px-3 text-sm" autoFocus required />
              <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What should this agent do?" className="h-10 rounded-lg border bg-background px-3 text-sm" />
              <button disabled={createMutation.isPending || !name.trim()} className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">{createMutation.isPending ? "Creating..." : "Create"}</button>
            </div>
          </form>
        )}

        {error && <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</p>}

        {agentsQuery.isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading agents...</div>
        ) : agents.length === 0 ? (
          <div className="rounded-xl border border-dashed p-12 text-center">
            <IconRobot className="mx-auto size-7 text-muted-foreground" />
            <h2 className="mt-3 text-sm font-semibold">No agents yet</h2>
            <p className="mt-1 text-xs text-muted-foreground">Create the first AI agent for this organization.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {agents.map((agent) => (
              <article key={agent.id} className="rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><IconRobot className="size-4" /></div>
                    <div className="min-w-0"><h2 className="truncate text-sm font-semibold">{agent.name}</h2><p className="text-[11px] text-muted-foreground">{agent.enabled ? "Enabled" : "Disabled"}</p></div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" title={agent.enabled ? "Disable agent" : "Enable agent"} onClick={() => updateMutation.mutate({ id: agent.id, enabled: !agent.enabled })} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">{agent.enabled ? <IconPlayerPause className="size-3.5" /> : <IconPlayerPlay className="size-3.5" />}</button>
                    <button type="button" title="Delete agent" onClick={() => deleteMutation.mutate(agent.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><IconTrash className="size-3.5" /></button>
                  </div>
                </div>
                <p className="mt-4 min-h-10 text-xs leading-5 text-muted-foreground">{agent.description || "No description provided."}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
