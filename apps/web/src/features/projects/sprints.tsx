import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { projectsApi, statusesApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { client } from "@/lib/api/client";
import { PagePanel, pagePrimaryAction, pageSecondaryAction } from "@/components/workspace/page-layout";
import { WorkflowError, WorkflowField, WorkflowSheet, WorkflowSubmit, useWorkflowMutation } from "@/components/workspace/workflow";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Sprint = { id: string; name: string; status: string; startDate: string | null; endDate: string | null };

export function Sprints({ org, project }: { org: string; project: string }) {
  const path = `/organization/${org}/projects/${project}/sprints`;
  const key = ["sprints", org, project];
  const query = useQuery({ queryKey: key, queryFn: () => client.request<Sprint[]>(path), retry: false });
  const [selected, setSelected] = useState<Sprint | null>(null);
  const [editing, setEditing] = useState<Sprint | "new" | null>(null);
  const mutation = useWorkflowMutation([key]);
  return <PagePanel>
    <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-sm font-semibold">Sprints</h2><button className={pagePrimaryAction} onClick={() => setEditing("new")}>Create sprint</button></div>
    <WorkflowError error={query.error || mutation.error} />
    {query.isPending && <p>Loading sprints…</p>}
    {query.isSuccess && !query.data.length && <p className="text-sm text-muted-foreground">Plan your next cycle by creating a sprint.</p>}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{query.data?.map((s) => <div key={s.id} className="rounded-xl border p-4"><span className="rounded-full bg-primary/10 px-2 py-1 text-xs capitalize text-primary">{s.status}</span><h3 className="my-3 font-medium">{s.name}</h3><p className="mb-4 text-xs text-muted-foreground">{s.startDate?.slice(0, 10) || "No start date"} — {s.endDate?.slice(0, 10) || "No end date"}</p><div className="flex flex-wrap gap-2">{["planned", "active"].includes(s.status) && <button className={pageSecondaryAction} disabled={mutation.isPending} onClick={() => mutation.mutate(() => client.request(`${path}/${s.id}`, { method: "PATCH", body: JSON.stringify({ status: s.status === "planned" ? "active" : "completed" }) }))}>{s.status === "planned" ? "Start" : "Complete"}</button>}<button className={pageSecondaryAction} onClick={() => setSelected(s)}>Tasks</button><button className={pageSecondaryAction} onClick={() => setEditing(s)}>Edit</button><ConfirmDialog title="Delete sprint?" destructive trigger={<button className={pageSecondaryAction} disabled={mutation.isPending}>Delete</button>} onConfirm={() => mutation.mutate(() => client.request(`${path}/${s.id}`, { method: "DELETE" }))} /></div></div>)}</div>
    {selected && <SprintTasks org={org} project={project} sprint={selected} onClose={() => setSelected(null)} />}
    {editing && <SprintForm path={path} queryKey={key} sprint={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
  </PagePanel>;
}

function SprintForm({ path, queryKey, sprint, onClose }: { path: string; queryKey: string[]; sprint?: Sprint; onClose: () => void }) {
  const [start, setStart] = useState(sprint?.startDate?.slice(0, 10) ?? "");
  const mutation = useWorkflowMutation([queryKey], onClose);
  return <WorkflowSheet title={sprint ? "Edit sprint" : "Create sprint"} onClose={onClose}><form className="space-y-4" onSubmit={(e) => { e.preventDefault(); const data = new FormData(e.currentTarget); mutation.mutate(() => client.request(sprint ? `${path}/${sprint.id}` : path, { method: sprint ? "PATCH" : "POST", body: JSON.stringify({ name: String(data.get("name")).trim(), ...(start ? { startDate: start } : {}), ...(data.get("end") ? { endDate: data.get("end") } : {}) }) })); }}><WorkflowField label="Sprint name" name="name" required maxLength={255} defaultValue={sprint?.name} /><WorkflowField label="Start date" type="date" value={start} onChange={(e) => setStart(e.target.value)} /><WorkflowField label="End date" type="date" name="end" min={start} defaultValue={sprint?.endDate?.slice(0, 10) ?? ""} /><WorkflowError error={mutation.error} /><WorkflowSubmit pending={mutation.isPending} /></form></WorkflowSheet>;
}

function SprintTasks({ org, project, sprint, onClose }: { org: string; project: string; sprint: Sprint; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const tasks = useQuery({ queryKey: queryKeys.tasks(org, project), queryFn: () => projectsApi.getTasks(org, project) });
  const statuses = useQuery({ queryKey: queryKeys.statuses(org, project), queryFn: () => statusesApi.getStatuses(org, project) });
  const mutation = useWorkflowMutation([queryKeys.tasks(org, project)]);
  const assigned = tasks.data?.filter((t) => t.sprintId === sprint.id) ?? [];
  const done = assigned.filter((t) => statuses.data?.find((s) => s.id === t.statusId)?.group === "done").length;
  return <WorkflowSheet title={sprint.name} onClose={onClose}><div className="space-y-5"><p className="text-sm text-muted-foreground">{done} of {assigned.length} tasks completed</p><progress className="h-2 w-full accent-primary" value={done} max={assigned.length || 1} aria-label="Sprint progress" /><WorkflowField label="Find tasks" value={search} onChange={(e) => setSearch(e.target.value)} /><WorkflowError error={tasks.error || statuses.error || mutation.error} />{tasks.isPending && <p role="status">Loading tasks…</p>}{tasks.data?.filter((t) => t.name.toLowerCase().includes(search.toLowerCase())).map((t) => <label key={t.id} className="flex items-center gap-3 rounded-xl border p-3 text-sm"><input type="checkbox" checked={t.sprintId === sprint.id} disabled={mutation.isPending} onChange={(e) => mutation.mutate(() => projectsApi.updateTask(org, project, t.id, { sprintId: e.target.checked ? sprint.id : null }))} /><span>{t.name}<span className="block text-xs text-muted-foreground">{statuses.data?.find((s) => s.id === t.statusId)?.name}{t.sprintId && t.sprintId !== sprint.id ? " · Assigned to another sprint (checking moves it here)" : ""}</span></span></label>)}{tasks.isSuccess && !tasks.data.length && <p className="text-sm text-muted-foreground">Create tasks in this project to add them to the sprint.</p>}</div></WorkflowSheet>;
}
