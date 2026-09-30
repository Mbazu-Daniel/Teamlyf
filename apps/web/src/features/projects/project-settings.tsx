// fallow-ignore-file complexity
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
import { projectMembersApi, projectsApi, settingsApi, statusesApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { projectSlug } from "@/lib/slug";
import { cn } from "@/lib/utils";
import { ProjectLeads } from "./project-leads";
import { PROJECT_CODE_MAX, PROJECT_CODE_MIN } from "./use-projects";
import { pageInput } from "@/components/workspace/page-layout";
import { ImageUpload } from "@/components/workspace/image-upload";

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

export function ProjectSettings({
  project,
  organizationId,
  organizationSlug,
}: ProjectSettingsProps) {
  const [tab, setTab] = useState<"general" | "members" | "states">("general");

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="mx-auto flex min-h-0 w-full max-w-[1180px] flex-1 flex-col px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-4">
          <Link
            to="/$organizationSlug/projects/$projectId"
            params={{ organizationSlug, projectId: projectSlug(project) }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <IconChevronLeft className="size-4" />
            Back to project
          </Link>
          <h1 className="mt-4 text-xl font-semibold tracking-tight">Project settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {project.name} Â· details, people, and workflow states.
          </p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[16px] border border-border/70 bg-card md:flex-row">
          <nav
            className="flex shrink-0 gap-1 overflow-x-auto border-b border-border/70 bg-muted/20 p-3 md:w-48 md:flex-col md:border-b-0 md:border-r"
            aria-label="Project settings"
          >
            {(
              [
                { id: "general", label: "General", icon: IconSettings },
                { id: "members", label: "Members", icon: IconCircleDot },
                { id: "states", label: "States", icon: IconCircleDot },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={tab === id}
                onClick={() => setTab(id as typeof tab)}
                className={cn(
                  "flex h-control shrink-0 items-center gap-2.5 rounded-[10px] px-3 text-left text-[13px] font-medium transition-colors md:w-full",
                  tab === id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </nav>

          <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 md:p-6">
            {tab === "general" && (
              <GeneralSettings
                organizationId={organizationId}
                organizationSlug={organizationSlug}
                project={project}
              />
            )}
            {tab === "members" && (
              <MembersSettings project={project} organizationId={organizationId} />
            )}
            {tab === "states" && (
              <WorkflowSettings organizationId={organizationId} projectId={project.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function GeneralSettings({
  organizationId,
  organizationSlug,
  project,
}: {
  organizationId: string;
  organizationSlug: string;
  project: Project;
}) {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState(project.identifier);
  const [status, setStatus] = useState(project.status ?? "planned");
  const [leadIds, setLeadIds] = useState(project.leads?.map((m) => m.id) ?? []);
  const queryClient = useQueryClient();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [emoji, setEmoji] = useState(project.emoji ?? "");
  const [image, setImage] = useState(project.image ?? "");
  const [coverImageURL, setCoverImageURL] = useState(project.coverImageURL ?? "");
  const [saved, setSaved] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      projectsApi.update(organizationId, project.id, {
        name: name.trim(),
        description: description.trim(),
        emoji: emoji.trim(),
        image: image || null,
        coverImageURL: coverImageURL || null,
        identifier: identifier.trim(),
        status,
        leadIds,
      }),
    onSuccess: async () => {
      setSaved(true);
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects(organizationId) });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.project(organizationId, project.id),
      });

      const nextSlug = projectSlug({ name });
      if (nextSlug !== projectSlug(project))
        await navigate({
          to: "/$organizationSlug/projects/$projectId/settings",
          params: { organizationSlug, projectId: nextSlug },
        });
      window.setTimeout(() => setSaved(false), 1800);
    },
  });

  return (
    <div className="max-w-3xl space-y-6">
      <section className="rounded-[16px] border border-border/70 bg-card p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold">General</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Update the project name, code, description, and icon.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-[1fr_160px]">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Project name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-control w-full rounded-[12px] border border-border/80 bg-muted/30 px-4 text-sm font-normal outline-none transition-colors focus:border-primary/50 focus:bg-card focus:ring-2 focus:ring-primary/10"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Code
            </span>
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              minLength={PROJECT_CODE_MIN}
              maxLength={PROJECT_CODE_MAX}
              className={pageInput}
              aria-label="Project code"
            />
            <span className="block text-xs text-muted-foreground">
              {PROJECT_CODE_MIN}-{PROJECT_CODE_MAX} characters.
            </span>
          </label>
        </div>

        <label className="mt-5 block text-sm">
          Project status
          <select className={pageInput} value={status} onChange={(e) => setStatus(e.target.value)}>
            {["planned", "backlog", "in_progress", "paused", "completed", "cancelled"].map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <ProjectLeads org={organizationId} selected={leadIds} onChange={setLeadIds} />
        <label className="mt-5 block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Icon
          </span>
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            maxLength={8}
            placeholder="🚀"
            aria-label="Project emoji"
            className="h-control w-24 rounded-[12px] border border-border/80 bg-muted/30 px-4 text-sm outline-none focus:border-primary/50"
          />
          <span className="block text-xs text-muted-foreground">
            A fallback for when no image is set.
          </span>
        </label>

        {/* Both were rendered on cards but had nowhere to be chosen, so the image
            slots in the UI always stayed empty. */}
        <div className="mt-5">
          <ImageUpload
            label="Project image"
            value={image}
            onChange={setImage}
            hint="Shown on project cards and in the sidebar. Overrides the emoji."
          />
        </div>
        <div className="mt-5">
          <ImageUpload
            label="Cover image"
            value={coverImageURL}
            onChange={setCoverImageURL}
            hint="A wide banner behind the project header."
          />
        </div>

        <label className="mt-5 block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Description
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="What is this project about?"
            className="w-full resize-none rounded-[12px] border border-border/80 bg-muted/30 p-4 text-sm leading-6 outline-none focus:border-primary/50"
          />
        </label>

        <div className="mt-5 flex items-center justify-end gap-3">
          {mutation.error && (
            <span className="mr-auto text-xs text-destructive">Unable to save changes.</span>
          )}
          {saved && (
            <span className="mr-auto inline-flex items-center gap-1 text-xs text-emerald-600">
              <IconCheck className="size-3.5" /> Saved
            </span>
          )}
          <button
            type="button"
            disabled={mutation.isPending || !name.trim()}
            onClick={() => mutation.mutate()}
            className="inline-flex h-control items-center gap-1.5 rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground disabled:opacity-50 cursor-pointer"
          >
            {mutation.isPending && <IconLoader2 className="size-3.5 animate-spin" />}
            {mutation.isPending ? "Saving..." : "Save changes"}
          </button>
        </div>
      </section>

      <DangerZone
        organizationId={organizationId}
        organizationSlug={organizationSlug}
        project={project}
      />
    </div>
  );
}

function MembersSettings({
  project,
  organizationId,
}: {
  project: Project;
  organizationId: string;
}) {
  const queryClient = useQueryClient();
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const membersQuery = useQuery({
    queryKey: queryKeys.members(organizationId),
    queryFn: () => settingsApi.members(organizationId),
  });
  const projectMembersQuery = useQuery({
    queryKey: [...queryKeys.project(organizationId, project.id), "members"],
    queryFn: () => projectMembersApi.get(organizationId, project.id),
  });

  const add = useMutation({
    mutationFn: () => projectMembersApi.add(organizationId, project.id, [selectedMemberId]),
    onSuccess: () => {
      setSelectedMemberId("");
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.project(organizationId, project.id), "members"],
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.project(organizationId, project.id),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects(organizationId) });
    },
  });

  const remove = useMutation({
    mutationFn: (memberId: string) =>
      projectMembersApi.remove(organizationId, project.id, memberId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...queryKeys.project(organizationId, project.id), "members"],
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.project(organizationId, project.id),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects(organizationId) });
    },
  });

  const projectMembers = projectMembersQuery.data ?? [];
  const assignedIds = new Set(projectMembers.map((item) => item.memberId));
  const availableMembers = (membersQuery.data?.members ?? []).filter(
    (item) => !assignedIds.has(item.id),
  );

  return (
    <section className="max-w-3xl space-y-5">
      <div>
        <h2 className="text-base font-semibold">Members</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the teammates who have access to this project's work.
        </p>
      </div>

      <div className="rounded-xl border bg-card">
        {projectMembersQuery.isPending ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading members</div>
        ) : projectMembers.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No project members yet.
          </div>
        ) : (
          projectMembers.map((item) => {
            const name =
              [item.member.firstName, item.member.lastName].filter(Boolean).join(" ") ||
              item.member.user?.name ||
              "Team member";
            return (
              <div
                key={item.id}
                className="flex items-center justify-between border-b px-4 py-3 last:border-b-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold">
                    {name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.role === "admin" ? "Project admin" : "Member"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={remove.isPending}
                  onClick={() => void remove.mutateAsync(item.memberId)}
                  className="rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3">
          <h3 className="text-sm font-semibold">Add member</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Only members of this organization can be assigned to the project.
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedMemberId}
            onChange={(event) => setSelectedMemberId(event.target.value)}
            className="h-control min-w-0 flex-1 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
          >
            <option value="">Select a member</option>
            {availableMembers.map((member) => {
              const name = member.user?.name || member.user?.email || member.id;
              return (
                <option key={member.id} value={member.id}>
                  {name}
                </option>
              );
            })}
          </select>
          <button
            type="button"
            disabled={!selectedMemberId || add.isPending}
            onClick={() => void add.mutateAsync()}
            className="inline-flex h-control items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-50"
          >
            {add.isPending ? "Adding" : "Add"}
          </button>
        </div>
        {add.error && <p className="mt-2 text-xs text-destructive">Unable to add this member.</p>}
        {remove.error && (
          <p className="mt-2 text-xs text-destructive">Unable to remove this member.</p>
        )}
      </div>
    </section>
  );
}

function WorkflowSettings({
  organizationId,
  projectId,
}: {
  organizationId: string;
  projectId: string;
}) {
  const queryClient = useQueryClient();
  const statusesQuery = useQuery({
    queryKey: queryKeys.statuses(organizationId, projectId),
    queryFn: () => statusesApi.getStatuses(organizationId, projectId),
  });
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(STATUS_COLORS[0]);
  const [editing, setEditing] = useState<Record<string, { name: string; color: string }>>({});

  const create = useMutation({
    mutationFn: () =>
      statusesApi.createStatus(organizationId, projectId, {
        name: newName.trim(),
        color: newColor,
      }),
    onSuccess: () => {
      setNewName("");
      setNewColor(STATUS_COLORS[0]);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.statuses(organizationId, projectId),
      });
    },
  });

  const update = useMutation({
    mutationFn: ({ id, name, color }: { id: string; name: string; color: string }) =>
      statusesApi.updateStatus(organizationId, projectId, id, { name: name.trim(), color }),
    onSuccess: () => {
      setEditing({});
      void queryClient.invalidateQueries({
        queryKey: queryKeys.statuses(organizationId, projectId),
      });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => statusesApi.deleteStatus(organizationId, projectId, id),
    onSuccess: () =>
      void queryClient.invalidateQueries({
        queryKey: queryKeys.statuses(organizationId, projectId),
      }),
  });

  const statuses = statusesQuery.data ?? [];

  return (
    <section className="max-w-3xl space-y-5">
      <div>
        <h2 className="text-base font-semibold">States</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure the workflow columns used by this project's board and list.
        </p>
      </div>

      {statusesQuery.isPending ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <IconLoader2 className="size-5 animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {statuses.map((status) => {
            const draft = editing[status.id];
            return (
              <div
                key={status.id}
                className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5"
              >
                {draft ? (
                  <>
                    <ColorPicker
                      value={draft.color}
                      onChange={(color) =>
                        setEditing((current) => ({ ...current, [status.id]: { ...draft, color } }))
                      }
                    />
                    <input
                      value={draft.name}
                      onChange={(e) =>
                        setEditing((current) => ({
                          ...current,
                          [status.id]: { ...draft, name: e.target.value },
                        }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          void update.mutateAsync({
                            id: status.id,
                            name: draft.name,
                            color: draft.color,
                          });
                        if (e.key === "Escape")
                          setEditing((current) => {
                            const next = { ...current };
                            delete next[status.id];
                            return next;
                          });
                      }}
                      className="h-control min-w-0 flex-1 rounded-md border bg-background px-2 text-sm outline-none focus:border-primary"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() =>
                        void update.mutateAsync({
                          id: status.id,
                          name: draft.name,
                          color: draft.color,
                        })
                      }
                      className="rounded-md p-1.5 hover:bg-muted"
                      aria-label="Save status"
                    >
                      <IconCheck className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditing((current) => {
                          const next = { ...current };
                          delete next[status.id];
                          return next;
                        })
                      }
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                      aria-label="Cancel"
                    >
                      <IconX className="size-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span
                      className="size-3 shrink-0 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {status.name}
                    </span>
                    {status.default && (
                      <span className="text-[10px] text-muted-foreground">Default</span>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setEditing((current) => ({
                          ...current,
                          [status.id]: { name: status.name, color: status.color },
                        }))
                      }
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label={`Edit ${status.name}`}
                    >
                      <IconPencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove.mutateAsync(status.id)}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Delete ${status.name}`}
                    >
                      <IconTrash className="size-3.5" />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="border-t border-dashed pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Add state
        </p>
        <div className="flex items-center gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newName.trim()) void create.mutateAsync();
            }}
            placeholder="e.g. Ready for QA"
            className="h-control min-w-0 flex-1 rounded-md border bg-background px-3 text-sm outline-none focus:border-primary"
          />
          <ColorPicker value={newColor} onChange={setNewColor} />
          <button
            type="button"
            disabled={!newName.trim() || create.isPending}
            onClick={() => void create.mutateAsync()}
            className="inline-flex h-control items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-50"
          >
            <IconPlus className="size-3.5" /> Add
          </button>
        </div>
      </div>
    </section>
  );
}

function ColorPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="relative grid size-7 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full border bg-background">
      <span className="size-5 rounded-full" style={{ backgroundColor: value }} />
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
        aria-label="Status color"
      />
    </label>
  );
}

function DangerZone({
  organizationId,
  organizationSlug,
  project,
}: {
  organizationId: string;
  organizationSlug: string;
  project: Project;
}) {
  const navigate = useNavigate();
  const mutation = useMutation({
    mutationFn: () => projectsApi.delete(organizationId, project.id),
    onSuccess: () =>
      void navigate({ to: "/$organizationSlug/projects", params: { organizationSlug } }),
  });

  return (
    <section className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
      <div className="flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive">
          <IconAlertTriangle className="size-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold">Danger zone</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Deleting this project removes it and its tasks from active views.
          </p>
        </div>
      </div>
      <button
        type="button"
        disabled={mutation.isPending}
        onClick={() => {
          if (window.confirm(`Delete â€œ${project.name}â€? This cannot be undone.`))
            mutation.mutate();
        }}
        className="mt-4 inline-flex h-control items-center gap-1.5 rounded-md bg-destructive px-3 text-xs font-semibold text-destructive-foreground disabled:opacity-50"
      >
        <IconAlertTriangle className="size-3.5" />
        {mutation.isPending ? "Deleting" : "Delete project"}
      </button>
    </section>
  );
}
