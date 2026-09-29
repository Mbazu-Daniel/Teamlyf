import { useEffect, useState } from "react";
import { settingsApi } from "@/lib/api";
import { SettingsSection } from "@/components/workspace/page-layout";
import { IconShield } from "@tabler/icons-react";

const permissions = [["Projects", "pm", "create, read, update, delete"], ["Chat", "chat", "create, read, update, delete"], ["Documents", "docs", "create, read, update, delete"], ["Notes", "notes", "create, read, update, delete"], ["HR", "hr", "create, read, update, delete"], ["Billing", "billing", "create, read, update, delete"], ["Agents", "agents", "create, read, update, delete"]] as const;

export function useAccessSettings(organizationId: string | undefined) {
  const [memberRole, setMemberRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setMemberRole(null);
    if (!organizationId) return;
    let active = true;
    setError(null);
    void settingsApi.activeMemberRole(organizationId)
      .then((result) => { if (active) setMemberRole(normalizeRole(result.role)); })
      .catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : "Unable to load access settings"); });
    return () => { active = false; };
  }, [organizationId]);
  return { memberRole, error };
}

function normalizeRole(role: unknown): string | null {
  if (Array.isArray(role)) return role[0] ?? null;
  return typeof role === "string" ? role : null;
}

export function AccessSettingsContent({ state }: { state: ReturnType<typeof useAccessSettings> }) {
  return <div className="space-y-6"><AccessSummary memberRole={state.memberRole} error={state.error} /><PermissionList />{state.error && <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{state.error}</p>}</div>;
}

function AccessSummary({ memberRole, error }: { memberRole: string | null; error: string | null }) {
  return <SettingsSection title="Your workspace access" description="Your organization role determines which resources and actions are available to you."><div className="flex items-center gap-4 rounded-[14px] border border-primary/15 bg-primary/5 p-5"><span className="grid size-12 place-items-center rounded-[12px] bg-primary/10 text-primary"><IconShield className="size-6" /></span><div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Your role</p><p className="mt-1 text-lg font-semibold capitalize">{error ? "Unavailable" : memberRole ?? "Loading..."}</p></div></div></SettingsSection>;
}

function PermissionList() {
  return <SettingsSection title="Organization permissions" description="Resources managed by your workspace roles."><div className="overflow-x-auto rounded-[12px] border border-border/70"><table className="w-full min-w-[360px] text-left"><thead className="bg-muted/40 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"><tr><th className="px-4 py-3">Resource</th><th className="px-4 py-3">Managed actions</th></tr></thead><tbody>{permissions.map(([label, resource, actions]) => <tr key={resource} className="border-t border-border/60 transition-colors hover:bg-muted/20"><td className="px-4 py-4 text-[13px] font-medium">{label}</td><td className="px-4 py-4"><div className="flex flex-wrap gap-1.5">{actions.split(", ").map((action) => <span key={action} className="rounded-md border border-border/60 bg-muted/30 px-2 py-1 text-[11px] capitalize text-muted-foreground">{action}</span>)}</div></td></tr>)}</tbody></table></div><p className="mt-4 text-xs leading-5 text-muted-foreground">This lists the actions managed for each resource. Your role determines which actions you can perform.</p></SettingsSection>;
}
