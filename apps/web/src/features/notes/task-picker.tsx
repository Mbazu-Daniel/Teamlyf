import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { pageInput } from "@/components/workspace/page-layout";
import { WorkflowError } from "@/components/workspace/workflow";

export function NoteTaskPicker({
  org,
  selected,
  onChange,
}: {
  org: string;
  selected: string | null;
  onChange: (task: string | null) => void;
}) {
  const [project, setProject] = useState("");
  const projects = useQuery({
    queryKey: queryKeys.projects(org),
    queryFn: () => projectsApi.getProjects(org),
  });
  const tasks = useQuery({
    queryKey: queryKeys.tasks(org, project),
    queryFn: () => projectsApi.getTasks(org, project),
    enabled: !!project,
  });
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">Linked task</legend>
      {selected && (
        <p className="text-xs text-muted-foreground">
          Task linked{" "}
          <button
            type="button"
            className="ml-2 text-primary underline"
            onClick={() => onChange(null)}
          >
            Unlink
          </button>
        </p>
      )}
      <select
        aria-label="Task project"
        className={pageInput}
        value={project}
        onChange={(e) => setProject(e.target.value)}
      >
        <option value="">Choose project…</option>
        {projects.data?.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      {project && (
        <select
          aria-label="Linked task"
          className={pageInput}
          value={selected ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
        >
          <option value="">No linked task</option>
          {tasks.data?.map((task) => (
            <option key={task.id} value={task.id}>
              {task.name}
            </option>
          ))}
        </select>
      )}
      <WorkflowError error={projects.error ?? tasks.error} />
    </fieldset>
  );
}
