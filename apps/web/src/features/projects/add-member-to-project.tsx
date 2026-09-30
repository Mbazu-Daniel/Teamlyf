import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { projectMembersApi, projectsApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { pageInput } from "@/components/workspace/page-layout";
import {
  WorkflowError,
  WorkflowSheet,
  WorkflowSubmit,
  useWorkflowMutation,
} from "@/components/workspace/workflow";

export function AddMemberToProject({
  org,
  member,
  onClose,
}: {
  org: string;
  member: string;
  onClose: () => void;
}) {
  const [project, setProject] = useState("");
  const query = useQuery({
    queryKey: queryKeys.projects(org),
    queryFn: () => projectsApi.getProjects(org),
  });
  const mutation = useWorkflowMutation(
    [queryKeys.projects(org), ["project-members", org, project]],
    onClose,
  );
  return (
    <WorkflowSheet title="Add to project" onClose={onClose}>
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate(() => projectMembersApi.add(org, project, [member]));
        }}
      >
        <label className="block space-y-2 text-sm">
          <span>Project</span>
          <select
            className={pageInput}
            required
            value={project}
            onChange={(event) => setProject(event.target.value)}
          >
            <option value="">Select project…</option>
            {query.data?.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        {query.isPending && <p role="status">Loading projects…</p>}
        {query.isSuccess && !query.data.length && (
          <p className="text-sm text-muted-foreground">Create a project first.</p>
        )}
        <WorkflowError error={query.error || mutation.error} />
        <WorkflowSubmit pending={mutation.isPending || !project} label="Add member" />
      </form>
    </WorkflowSheet>
  );
}
