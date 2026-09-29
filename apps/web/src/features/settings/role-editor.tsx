import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { administrationApi, type WorkspaceRole } from "@/lib/api/administration";
import { SettingsSection, pageSecondaryAction } from "@/components/workspace/page-layout";
import { WorkflowSheet, WorkflowField, WorkflowError, WorkflowSubmit, useWorkflowMutation } from "@/components/workspace/workflow";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function RoleEditor({ org }: { org: string }) {
  const roles = useQuery({ queryKey: ["roles", org], queryFn: () => administrationApi.roles(org), retry: false });
  const catalog = useQuery({ queryKey: ["permission-catalog", org], queryFn: () => administrationApi.catalog(org), retry: false });
  const [editing, setEditing] = useState<WorkspaceRole | "new" | null>(null);
  const remove = useWorkflowMutation([["roles", org]]);
  return <SettingsSection title="Custom roles" description="Built-in owner, admin and member roles remain unchanged. Create custom roles with only the permissions people need.">
    <WorkflowError error={roles.error ?? catalog.error ?? remove.error} />
    {roles.isPending && <p className="text-sm text-muted-foreground">Loading roles…</p>}
    {!roles.error && <button className={pageSecondaryAction} onClick={() => setEditing("new")}>Create role</button>}
    <div className="mt-4 divide-y">{roles.data?.map((role) => <div key={role.id} className="flex flex-wrap items-center gap-3 py-4"><div className="flex-1"><p className="text-sm font-medium">{role.role}</p><p className="text-xs text-muted-foreground">{Object.values(role.permission).flat().length} permissions</p></div><button className={pageSecondaryAction} onClick={() => setEditing(role)}>Edit</button><ConfirmDialog title={`Delete ${role.role}?`} description="Remove this role only after reassigning its members. This cannot be undone." confirmLabel="Delete role" destructive onConfirm={() => remove.mutate(() => administrationApi.deleteRole(org, role.role))} trigger={<button disabled={remove.isPending} className={pageSecondaryAction}>Delete</button>} /></div>)}</div>
    {!roles.isPending && !roles.error && !roles.data?.length && <p className="mt-4 text-sm text-muted-foreground">No custom roles yet.</p>}
    {editing && catalog.data && <RoleForm org={org} value={editing === "new" ? undefined : editing} catalog={catalog.data} onClose={() => setEditing(null)} />}
  </SettingsSection>;
}

function RoleForm({ org, value, catalog, onClose }: { org: string; value?: WorkspaceRole; catalog: Record<string, string[]>; onClose: () => void }) {
  const [name, setName] = useState(value?.role ?? "");
  const [permissions, setPermissions] = useState(value?.permission ?? {});
  const save = useWorkflowMutation([["roles", org]], onClose);
  function toggle(resource: string, action: string, checked: boolean) {
    setPermissions((current) => ({ ...current, [resource]: checked ? [...(current[resource] ?? []), action] : (current[resource] ?? []).filter((item) => item !== action) }));
  }
  return <WorkflowSheet title={value ? "Edit role" : "Create role"} onClose={onClose}><form className="space-y-5" onSubmit={(event) => { event.preventDefault(); save.mutate(() => administrationApi.saveRole(org, name.trim(), permissions, value?.role)); }}><WorkflowField label="Role name" value={name} onChange={(event) => setName(event.target.value)} required pattern="[a-z][a-z0-9_-]*" maxLength={60} /><div className="divide-y rounded-xl border px-4">{Object.entries(catalog).map(([resource, actions]) => <fieldset key={resource} className="py-4"><legend className="pt-3 text-sm font-medium capitalize">{resource}</legend><div className="flex flex-wrap gap-4">{actions.map((action) => <label key={action} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={permissions[resource]?.includes(action) ?? false} onChange={(event) => toggle(resource, action, event.target.checked)} />{action}</label>)}</div></fieldset>)}</div><WorkflowError error={save.error} /><WorkflowSubmit pending={save.isPending} /></form></WorkflowSheet>;
}
