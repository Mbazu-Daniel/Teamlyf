import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IconPlus, IconRobot, IconTrash, IconPlayerPause, IconPlayerPlay } from "@tabler/icons-react";
import { agentsApi, type Agent } from "@/lib/api";
import { useOrganization } from "@/lib/organization";
import { getErrorMessage } from "@/lib/error-message";
import { PageEmptyState, PageHeader, PagePanel, WorkspacePage, pageInput, pagePrimaryAction } from "@/components/workspace/page-layout";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

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
    <WorkspacePage>
      <PageHeader title="AI agents" eyebrow="Your digital teammates" description="Manage the agents that work alongside your team." actions={<button type="button" onClick={() => setCreating(true)} className={pagePrimaryAction}><IconPlus className="size-4" />Create agent</button>} />

      <PagePanel>
        <div className="mb-5 flex items-center justify-between border-b border-border/60 pb-4"><h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Workspace agents</h2><span className="text-xs text-muted-foreground">{agentsQuery.isLoading ? "Loading…" : `${agents.length} agents`}</span></div>
        <Sheet open={creating} onOpenChange={setCreating}><SheetContent className="sm:max-w-md">
          <SheetHeader><SheetTitle>Create agent</SheetTitle><SheetDescription>Give your new teammate a name and a purpose.</SheetDescription></SheetHeader>
          <form onSubmit={(event) => { event.preventDefault(); if (!name.trim() || createMutation.isPending) return; createMutation.mutate(); }} className="flex min-h-0 flex-1 flex-col p-6">
            <div className="grid gap-5">
              <label className="space-y-2 text-xs font-medium">Agent name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Research assistant" className={`${pageInput} mt-2`} autoFocus required /></label>
              <label className="space-y-2 text-xs font-medium">Purpose<input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What should this agent do?" className={`${pageInput} mt-2`} /></label>
            </div>
            {createMutation.error && <p role="alert" className="mt-4 text-sm text-destructive">{getErrorMessage(createMutation.error, "Unable to create agent")}</p>}
            <div className="mt-auto border-t border-border/70 pt-5"><button disabled={createMutation.isPending || !name.trim()} className={`${pagePrimaryAction} w-full`}>{createMutation.isPending ? "Creating..." : "Create agent"}</button></div>
          </form>
        </SheetContent></Sheet>

        {error && <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">{error}</p>}

        {agentsQuery.isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading agents...</div>
        ) : agents.length === 0 ? (
          <PageEmptyState icon={IconRobot} title="Meet your next teammate" description="Create an AI agent to support the work happening across your organization." action={<button type="button" onClick={() => setCreating(true)} className={pagePrimaryAction}><IconPlus className="size-4" />Create agent</button>} />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onToggle={(enabled) => updateMutation.mutate({ id: agent.id, enabled })}
                onDelete={() => deleteMutation.mutate(agent.id)}
              />
            ))}
          </div>
        )}
      </PagePanel>
    </WorkspacePage>
  );
}


type AgentCardProps = {
  agent: Agent;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
};

// fallow-ignore-next-line complexity -- agent card keeps status and action presentation together for a compact card surface
function AgentCard({ agent, onToggle, onDelete }: AgentCardProps) {
  return (
    <article className="rounded-[14px] border border-border/70 bg-card p-5 transition-colors hover:border-primary/30">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-[12px] bg-primary/10 text-primary"><IconRobot className="size-5" /></div>
          <div className="min-w-0"><h2 className="truncate text-sm font-semibold">{agent.name}</h2><p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className={`size-1.5 rounded-full ${agent.enabled ? "bg-emerald-500" : "bg-amber-500"}`} />{agent.enabled ? "Enabled" : "Disabled"}</p></div>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" title={agent.enabled ? "Disable agent" : "Enable agent"} onClick={() => onToggle(!agent.enabled)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">{agent.enabled ? <IconPlayerPause className="size-3.5" /> : <IconPlayerPlay className="size-3.5" />}</button>
          <button type="button" title="Delete agent" onClick={onDelete} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><IconTrash className="size-3.5" /></button>
        </div>
      </div>
      <p className="mt-4 min-h-10 text-xs leading-5 text-muted-foreground">{agent.description || "No description provided."}</p>
    </article>
  );
}
