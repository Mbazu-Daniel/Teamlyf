import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  IconAlertTriangle,
  IconCheck,
  IconChevronLeft,
  IconCircleDot,
  IconLoader2,
  IconPencil,
  IconPlus,
  IconSettings,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import type { Project } from "@/lib/api";
import { projectsApi, statusesApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { cn } from "@/lib/utils";

type ProjectSettingsProps = {
  project: Project;
  organizationId: string;
  organizationSlug: string;
};

const STATUS_COLORS = [
  "#6b7280",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
];

export function ProjectSettings({ project, organizationId, organizationSlug }: ProjectSettingsProps) {
  const [tab, setTab] = useState<"general" | "members" | "states">("general");

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-[var(--app-page-background)]">
      <div className="mx-auto flex min-h-0 w-full max-w-[1180px] flex-1 flex-col p-3 md:p-5">
        <div className="mb-4">
          <Link
            to="/$organizationSlug/projects/$projectId"
            params={{ organizationSlug, projectId: project.identifier }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <IconChevronLeft className="size-4" />
            Back to project
          </Link>
          <h1 className="mt-4 text-xl font-semibold tracking-tight">Project settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {project.name} · details, people, and workflow states.
          </p>
        </div>

        <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <nav className="w-40 shrink-0 border-r bg-muted/20 p-2 sm:w-48" aria-label="Project settings">
            {[
              ["general", "General", IconSettings],
              ["members", "Members", IconCircleDot],
              ["states", "States", IconCircleDot],
            ].map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id as typeof tab)}
                className={cn(
                  "mb-1 flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-xs font-medium",
                  tab === id ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </nav>

          <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
            {tab === "general" && <GeneralSettings organizationId={organizationId} organizationSlug={organizationSlug} project={project} />}
            {tab === "members" && <MembersSettings project={project} />}
            {tab === "states" && <WorkflowSettings organizationId={organizationId} projectId={project.id} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function GeneralSettings({ organizationId, organizationSlug, project }: { organizationId: string; organizationSlug: string; project: Project }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(project.name);
  const [identifier, setIdentifier] = useState(project.identifier);
  const [description, setDescription] = useState(project.description ?? "");
  const [emoji, setEmoji] = useState(project.emoji ?? "");
  const [saved, setSaved] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      projectsApi.update(organizationId, project.id, {
        name: name.trim(),
        description: description.trim(),
        emoji: emoji.trim(),
      }),
    onSuccess: async () => {
      setSaved(true);
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects(organizationId) });
      window.setTimeout(() => setSaved(false), 1800);
    },
  });

  return (
    <div className="max-w-3xl space-y-6">
      <section className="rounded-xl border bg-card p-5">
        <div className="mb-5">
          <h2 className="text-base font-semibold">General</h2>
          <p className="mt-1 text-sm text-muted-foreground">Update the project name, code, description, and icon.</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-[1fr_160px]">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Project name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus:border-primary" />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Code</span>
            <input value={identifier} readOnly className="h-9 w-full rounded-md border bg-muted px-3 text-sm font-semibold uppercase text-muted-foreground outline-none" />
          </label>
        </div>

        <label className="mt-5 block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Icon</span>
          <input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={8} placeholder="🚀" className="h-9 w-24 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary" />
        </label>

        <label className="mt-5 block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} placeholder="What is this project about?" className="w-full resize-none rounded-md border bg-background p-3 text-sm outline-none focus:border-primary" />
        </label>

        <div className="mt-5 flex items-center justify-end gap-3">
          {mutation.error && <span className="mr-auto text-xs text-destructive">Unable to save changes.</span>}
          {saved && <span className="mr-auto inline-flex items-center gap-1 text-xs text-emerald-600"><IconCheck className="size-3.5" /> Saved</span>}
          <button
            type="button"
            disabled={mutation.isPending || !name.trim()}
            onClick={() => mutation.mutate()}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground disabled:opacity-50"
          >
            {mutation.isPending && <IconLoader2 className="size-3.5 animate-spin" />}
            {mutation.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </section>

      <DangerZone organizationId={organizationId} organizationSlug={organizationSlug} project={project} />
    </div>
  );
}

function MembersSettings({ project }: { project: Project }) {
  const members = project.members ?? [];
  const leads = project.leads ?? [];

  return (
    <section className="max-w-3xl space-y-5">
      <div>
        <h2 className="text-base font-semibold">Members</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          People currently returned by the project API. Project membership mutations are kept disabled until the organization member mapping is exposed by the current API.
        </p>
      </div>
      <div className="rounded-xl border bg-card">
        {members.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No project members returned.</div>
        ) : (
          members.map((member) => (
            <div key={member.id} className="flex items-center justify-between border-b last:border-b-0 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-full bg-muted text-xs font-semibold">
                  {((member.firstName?.[0] ?? "") + (member.lastName?.[0] ?? "")).toUpperCase() || "M"}
                </div>
                <div>
                  <p className="text-sm font-medium">{member.firstName ?? ""} {member.lastName ?? ""}</p>
                  <p className="text-xs text-muted-foreground">{leads.some((lead) => lead.id === member.id) ? "Project lead" : "Member"}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function WorkflowSettings({ organizationId, projectId }: { organizationId: string; projectId: string }) {
  const queryClient = useQueryClient();
  const statusesQuery = useQuery({
    queryKey: queryKeys.statuses(organizationId, projectId),
    queryFn: () => statusesApi.getStatuses(organizationId, projectId),
  });
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(STATUS_COLORS[0]);
  const [editing, setEditing] = useState<Record<string, { name: string; color: string }>>({});

  const create = useMutation({
    mutationFn: () => statusesApi.createStatus(organizationId, projectId, { name: newName.trim(), color: newColor }),
    onSuccess: () => {
      setNewName("");
      setNewColor(STATUS_COLORS[0]);
      void queryClient.invalidateQueries({ queryKey: queryKeys.statuses(organizationId, projectId) });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, name, color }: { id: string; name: string; color: string }) =>
      statusesApi.updateStatus(organizationId, projectId, id, { name: name.trim(), color }),
    onSuccess: () => {
      setEditing({});
      void queryClient.invalidateQueries({ queryKey: queryKeys.statuses(organizationId, projectId) });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => statusesApi.deleteStatus(organizationId, projectId, id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.statuses(organizationId, projectId) }),
  });

  const statuses = statusesQuery.data ?? [];

  return (
    <section className="max-w-3xl space-y-5">
      <div>
        <h2 className="text-base font-semibold">States</h2>
        <p className="mt-1 text-sm text-muted-foreground">Configure the workflow columns used by this project's board and list.</p>
      </div>

      {statusesQuery.isPending ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground"><IconLoader2 className="size-5 animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {statuses.map((status) => {
            const draft = editing[status.id];
            return (
              <div key={status.id} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5">
                {draft ? (
                  <>
                    <ColorPicker value={draft.color} onChange={(color) => setEditing((current) => ({ ...current, [status.id]: { ...draft, color } }))} />
                    <input value={draft.name} onChange={(e) => setEditing((current) => ({ ...current, [status.id]: { ...draft, name: e.target.value } }))} onKeyDown={(e) => { if (e.key === "Enter") void update.mutateAsync({ id: status.id, name: draft.name, color: draft.color }); if (e.key === "Escape") setEditing((current) => { const next = { ...current }; delete next[status.id]; return next; }); }} className="h-8 min-w-0 flex-1 rounded-md border bg-background px-2 text-sm outline-none focus:border-primary" autoFocus />
                    <button type="button" onClick={() => void update.mutateAsync({ id: status.id, name: draft.name, color: draft.color })} className="rounded-md p-1.5 hover:bg-muted" aria-label="Save status"><IconCheck className="size-4" /></button>
                    <button type="button" onClick={() => setEditing((current) => { const next = { ...current }; delete next[status.id]; return next; })} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted" aria-label="Cancel"><IconX className="size-4" /></button>
                  </>
                ) : (
                  <>
                    <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: status.color }} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{status.name}</span>
                    {status.default && <span className="text-[10px] text-muted-foreground">Default</span>}
                    <button type="button" onClick={() => setEditing((current) => ({ ...current, [status.id]: { name: status.name, color: status.color } }))} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`Edit ${status.name}`}><IconPencil className="size-3.5" /></button>
                    <button type="button" onClick={() => void remove.mutateAsync(status.id)} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Delete ${status.name}`}><IconTrash className="size-3.5" /></button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="border-t border-dashed pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Add state</p>
        <div className="flex items-center gap-2">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newName.trim()) void create.mutateAsync(); }} placeholder="e.g. Ready for QA" className="h-9 min-w-0 flex-1 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary" />
          <ColorPicker value={newColor} onChange={setNewColor} />
          <button type="button" disabled={!newName.trim() || create.isPending} onClick={() => void create.mutateAsync()} className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-50"><IconPlus className="size-3.5" /> Add</button>
        </div>
      </div>
    </section>
  );
}

function ColorPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="relative grid size-7 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full border bg-background">
      <span className="size-5 rounded-full" style={{ backgroundColor: value }} />
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Status color" />
    </label>
  );
}

function DangerZone({ organizationId, organizationSlug, project }: { organizationId: string; organizationSlug: string; project: Project }) {
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: () => projectsApi.delete(organizationId, project.id),
    onSuccess: () => void navigate({ to: "/$organizationSlug/projects", params: { organizationSlug } }),
  });

  return (
    <section className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
      <div className="flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive"><IconAlertTriangle className="size-4" /></div>
        <div>
          <h2 className="text-base font-semibold">Danger zone</h2>
          <p className="mt-1 text-sm text-muted-foreground">Deleting this project removes it and its tasks from active views.</p>
        </div>
      </div>
      <button type="button" disabled={mutation.isPending} onClick={() => { if (window.confirm(`Delete “${project.name}”? This cannot be undone.`)) mutation.mutate(); }} className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-md bg-destructive px-3 text-xs font-semibold text-destructive-foreground disabled:opacity-50">
        <IconAlertTriangle className="size-3.5" />
        {mutation.isPending ? "Deleting…" : "Delete project"}
      </button>
    </section>
  );
}
