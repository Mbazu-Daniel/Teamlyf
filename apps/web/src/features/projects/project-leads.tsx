import { useQuery } from "@tanstack/react-query";
import { settingsApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { WorkflowError } from "@/components/workspace/workflow";

export function ProjectLeads({
  org,
  selected,
  onChange,
}: {
  org: string;
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const query = useQuery({
    queryKey: queryKeys.members(org),
    queryFn: () => settingsApi.members(org),
    enabled: !!org,
  });
  return (
    <fieldset className="mt-5 space-y-2">
      <legend className="text-sm font-medium">Project leads</legend>
      <WorkflowError error={query.error} />
      <div className="max-h-48 space-y-2 overflow-y-auto">
        {query.data?.members.map((m) => (
          <label key={m.id} className="flex gap-2 text-sm">
            <input
              type="checkbox"
              checked={selected.includes(m.id)}
              onChange={(e) =>
                onChange(
                  e.target.checked ? [...selected, m.id] : selected.filter((id) => id !== m.id),
                )
              }
            />
            {m.user?.name || m.user?.email}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
