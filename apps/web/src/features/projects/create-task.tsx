import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  projectsApi,
  statusesApi,
  settingsApi,
  agentsApi,
  type TaskPriority,
  type TaskAssigneeInput,
} from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import {
  WorkflowError,
  WorkflowField,
  WorkflowSheet,
  WorkflowSubmit,
  useWorkflowMutation,
} from "@/components/workspace/workflow";
import { pageInput } from "@/components/workspace/page-layout";
import { SprintPicker } from "./sprint-picker";
import { TaskLabels } from "./task-labels";

export function CreateTask({
  org,
  project: initialProject,
  status,
  onClose,
}: {
  org: string;
  project?: string;
  status?: string;
  onClose: () => void;
}) {
  const [project, setProject] = useState(initialProject ?? "");
  const [sprintId, setSprintId] = useState<string | null>(null);
  const [labels, setLabels] = useState<string[]>([]);
  const projects = useQuery({
    queryKey: queryKeys.projects(org),
    queryFn: () => projectsApi.getProjects(org),
  });
  const statuses = useQuery({
    queryKey: queryKeys.statuses(org, project),
    queryFn: () => statusesApi.getStatuses(org, project),
    enabled: !!project,
  });
  const members = useQuery({
    queryKey: queryKeys.members(org),
    queryFn: () => settingsApi.members(org),
  });
  const agents = useQuery({
    queryKey: ["agents", org],
    queryFn: () => agentsApi.list(org),
    retry: false,
  });
  const mutation = useWorkflowMutation([queryKeys.tasks(org, project)], onClose);
  return (
    <WorkflowSheet title="Create task" onClose={onClose}>
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const assignees: TaskAssigneeInput[] = data
            .getAll("member")
            .map((id) => ({ kind: "member", id: String(id) }));
          data.getAll("agent").forEach((id) => assignees.push({ kind: "agent", id: String(id) }));
          mutation.mutate(() =>
            projectsApi.createTask(org, project, {
              name: String(data.get("name")).trim(),
              description: String(data.get("description")),
              statusId: String(data.get("status")),
              priority: String(data.get("priority")) as TaskPriority,
              ...(data.get("due") ? { targetDate: String(data.get("due")) } : {}),
              assignees,
              sprintId,
              labelIds: labels,
            }),
          );
        }}
      >
        <label className="block text-sm">
          Project
          <select
            required
            className={pageInput}
            value={project}
            onChange={(e) => {
              setProject(e.target.value);
              setLabels([]);
              setSprintId(null);
            }}
            disabled={!!initialProject}
          >
            <option value="">Select project…</option>
            {projects.data?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <WorkflowField label="Task name" name="name" required maxLength={255} />
        <WorkflowField label="Description" name="description" />
        <label className="block text-sm">
          Status
          <select key={project} className={pageInput} name="status" required defaultValue={status}>
            <option value="">Select status…</option>
            {statuses.data?.map((s) => (
              <option value={s.id} key={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Priority
          <select className={pageInput} name="priority" defaultValue="none">
            {["none", "low", "medium", "high", "urgent"].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <WorkflowField label="Due date" name="due" type="date" />
        {project && (
          <SprintPicker org={org} project={project} value={sprintId} onChange={setSprintId} />
        )}
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Assignees</legend>
          <div className="max-h-40 space-y-2 overflow-y-auto">
            {members.data?.members.map((m) => (
              <label key={m.id} className="flex gap-2 text-sm">
                <input name="member" value={m.id} type="checkbox" />
                {m.user?.name || m.user?.email}
              </label>
            ))}
            {agents.data
              ?.filter((a) => a.enabled)
              .map((a) => (
                <label key={a.id} className="flex gap-2 text-sm">
                  <input name="agent" value={a.id} type="checkbox" />
                  {a.name} (agent)
                </label>
              ))}
          </div>
        </fieldset>
        {project && (
          <TaskLabels org={org} project={project} selected={labels} onChange={setLabels} />
        )}
        <WorkflowError
          error={
            mutation.error || projects.error || statuses.error || members.error || agents.error
          }
        />
        <WorkflowSubmit pending={mutation.isPending || !project} label="Create task" />
      </form>
    </WorkflowSheet>
  );
}
