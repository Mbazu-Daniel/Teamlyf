import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { labelsApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { pageInput, pageSecondaryAction } from "@/components/workspace/page-layout";
import { WorkflowError, useWorkflowMutation } from "@/components/workspace/workflow";

export function TaskLabels({
  org,
  project,
  selected,
  onChange,
}: {
  org: string;
  project: string;
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [name, setName] = useState("");
  const key = queryKeys.labels(org, project);
  const labels = useQuery({
    queryKey: key,
    queryFn: () => labelsApi.getLabels(org, project),
    enabled: !!project,
    retry: false,
  });
  const create = useWorkflowMutation([key], () => setName(""));
  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">Labels</legend>
      <WorkflowError error={labels.error || create.error} />
      <div className="flex flex-wrap gap-3">
        {labels.data?.map((label) => (
          <label
            key={label.id}
            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-xs"
          >
            <input
              type="checkbox"
              checked={selected.includes(label.id)}
              onChange={(e) =>
                onChange(
                  e.target.checked
                    ? [...selected, label.id]
                    : selected.filter((id) => id !== label.id),
                )
              }
            />
            <span
              className="size-2 rounded-full"
              style={{
                backgroundColor: /^#[0-9a-f]{6}$/i.test(label.color) ? label.color : "#7c3aed",
              }}
            />
            {label.name}
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          aria-label="New label name"
          placeholder="New label…"
          className={pageInput}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          type="button"
          className={pageSecondaryAction}
          disabled={!name.trim() || create.isPending}
          onClick={() =>
            create.mutate(() =>
              labelsApi.createLabel(org, project, { name: name.trim(), color: "#7c3aed" }),
            )
          }
        >
          Add label
        </button>
      </div>
    </fieldset>
  );
}
