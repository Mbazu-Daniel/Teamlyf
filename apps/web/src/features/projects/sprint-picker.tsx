import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/api/client";
import { pageInput } from "@/components/workspace/page-layout";
import { WorkflowError } from "@/components/workspace/workflow";

export function SprintPicker({
  org,
  project,
  value,
  onChange,
}: {
  org: string;
  project: string;
  value?: string | null;
  onChange: (id: string | null) => void;
}) {
  const query = useQuery({
    queryKey: ["sprints", org, project],
    queryFn: () =>
      client.request<{ id: string; name: string; status: string }[]>(
        `/organization/${org}/projects/${project}/sprints`,
      ),
    enabled: !!project,
    retry: false,
  });
  return (
    <div>
      <label className="block space-y-2 text-sm">
        <span>Sprint</span>
        <select
          className={pageInput}
          value={value ?? ""}
          onChange={(event) => onChange(event.target.value || null)}
          disabled={query.isPending}
        >
          <option value="">No sprint</option>
          {query.data?.map((sprint) => (
            <option key={sprint.id} value={sprint.id}>
              {sprint.name} · {sprint.status}
            </option>
          ))}
        </select>
      </label>
      <WorkflowError error={query.error} />
    </div>
  );
}
