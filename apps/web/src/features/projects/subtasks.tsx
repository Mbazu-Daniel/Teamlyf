import { useQuery } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { WorkflowError } from "@/components/workspace/workflow";

export function Subtasks({ org, project, task }: { org: string; project: string; task: string }) {
  const query = useQuery({ queryKey: queryKeys.tasks(org, project), queryFn: () => projectsApi.getTasks(org, project) });
  const children = query.data?.filter((t) => t.parentId === task) ?? [];
  return <section aria-label="Subtasks" className="rounded-xl border p-4"><h3 className="mb-3 text-sm font-semibold">Subtasks ({children.length})</h3><WorkflowError error={query.error} />{children.map((t) => <a key={t.id} href={`?task=${encodeURIComponent(t.id)}`} className="block border-t py-3 text-sm text-primary">#{t.sequenceId} {t.name}</a>)}{!children.length && <p className="text-xs text-muted-foreground">No subtasks.</p>}</section>;
}
