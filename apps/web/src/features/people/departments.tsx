import { useState } from "react";
import { queryKeys } from "@/lib/queryKeys";
import { useQuery } from "@tanstack/react-query";
import { IconBuilding } from "@tabler/icons-react";
import { hrApi, type Department, type OrganizationMember } from "@/lib/api";
import {
  PagePanel,
  ToolbarSearch,
  pageInput,
  pagePrimaryAction,
  pageSecondaryAction,
} from "@/components/workspace/page-layout";
import {
  WorkflowError,
  WorkflowField,
  WorkflowSheet,
  WorkflowSubmit,
  useWorkflowMutation,
} from "@/components/workspace/workflow";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { HrSection } from "./hr-section";

export function Departments({ org, members }: { org: string; members: OrganizationMember[] }) {
  const [editing, setEditing] = useState<Department | "new" | null>(null);
  const [search, setSearch] = useState("");
  const departments = useQuery({
    queryKey: queryKeys.departments(org),
    queryFn: () => hrApi.getDepartments(org),
    retry: false,
  });
  const mutation = useWorkflowMutation([queryKeys.departments(org)]);
  const rows = (departments.data ?? []).filter((d) =>
    d.name.toLowerCase().includes(search.trim().toLowerCase()),
  );
  return (
    <>
      <HrSection
        error={departments.error || mutation.error}
        loading={departments.isPending}
        loadingLabel="Loading departments..."
        toolbar={
          <>
            <ToolbarSearch
              value={search}
              onChange={setSearch}
              placeholder="Search departments"
              label="Search departments"
            />
            <button className={pagePrimaryAction} onClick={() => setEditing("new")}>
              Create department
            </button>
          </>
        }
        empty={
          rows.length === 0
            ? {
                icon: IconBuilding,
                title: search ? "No departments match that search" : "No departments yet",
                description: search
                  ? "Try a different name."
                  : "Group people into departments so the org chart and leave records have somewhere to sit.",
                action: search ? undefined : (
                  <button className={pagePrimaryAction} onClick={() => setEditing("new")}>
                    Create department
                  </button>
                ),
              }
            : null
        }
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((d) => (
            <PagePanel key={d.id} className="flex flex-col">
              <h2 className="font-semibold">{d.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {d.description || "No description yet."}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                {d.members.length === 1 ? "1 person" : `${d.members.length} people`}
              </p>
              <ul className="my-4 space-y-2">
                {d.members.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate">
                      {[m.firstName, m.lastName].filter(Boolean).join(" ") || m.id}
                    </span>
                    <ConfirmDialog
                      title="Remove from department?"
                      description="Workspace membership is not affected."
                      trigger={
                        <button className="text-xs text-destructive" disabled={mutation.isPending}>
                          Remove
                        </button>
                      }
                      onConfirm={() =>
                        mutation.mutate(() => hrApi.removeDepartmentMember(org, d.id, m.id))
                      }
                    />
                  </li>
                ))}
              </ul>
              <select
                aria-label={`Add member to ${d.name}`}
                className={pageInput}
                value=""
                disabled={mutation.isPending}
                onChange={(e) => {
                  const id = e.target.value;
                  if (id) mutation.mutate(() => hrApi.addDepartmentMember(org, d.id, id));
                }}
              >
                <option value="">Add a member…</option>
                {members
                  .filter((m) => !d.members.some((x) => x.id === m.id))
                  .map((m) => (
                    <option value={m.id} key={m.id}>
                      {[m.firstName, m.lastName].filter(Boolean).join(" ") ||
                        m.user?.name ||
                        "Name not set"}
                    </option>
                  ))}
              </select>
              <div className="mt-4 flex gap-2 border-t border-border/50 pt-4">
                <button className={pageSecondaryAction} onClick={() => setEditing(d)}>
                  Edit
                </button>
                <ConfirmDialog
                  title={`Delete ${d.name}?`}
                  description="This removes the department, not its workspace members."
                  destructive
                  trigger={
                    <button className={pageSecondaryAction} disabled={mutation.isPending}>
                      Delete
                    </button>
                  }
                  onConfirm={() => mutation.mutate(() => hrApi.deleteDepartment(org, d.id))}
                />
              </div>
            </PagePanel>
          ))}
        </div>
      </HrSection>
      {editing && (
        <DepartmentEditor
          org={org}
          department={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function DepartmentEditor({
  org,
  department,
  onClose,
}: {
  org: string;
  department?: Department;
  onClose: () => void;
}) {
  const mutation = useWorkflowMutation([queryKeys.departments(org)], onClose);
  return (
    <WorkflowSheet title={department ? "Edit department" : "Create department"} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const input = {
            name: String(data.get("name")).trim(),
            description: String(data.get("description")).trim(),
          };
          mutation.mutate(() =>
            department
              ? hrApi.updateDepartment(org, department.id, input)
              : hrApi.createDepartment(org, input),
          );
        }}
      >
        <WorkflowField label="Name" name="name" required defaultValue={department?.name ?? ""} />
        <WorkflowField
          label="Description"
          name="description"
          defaultValue={department?.description ?? ""}
        />
        <WorkflowError error={mutation.error} />
        <WorkflowSubmit pending={mutation.isPending} />
      </form>
    </WorkflowSheet>
  );
}
