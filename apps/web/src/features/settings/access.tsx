import { useEffect, useState } from "react";
import { settingsApi } from "@/lib/api";

const permissions = [
  ["Projects", "pm", "create, read, update, delete"],
  ["Chat", "chat", "create, read, update, delete"],
  ["Documents", "docs", "create, read, update, delete"],
  ["Notes", "notes", "create, read, update, delete"],
  ["HR", "hr", "create, read, update, delete"],
  ["Billing", "billing", "create, read, update, delete"],
  ["Agents", "agents", "create, read, update, delete"],
] as const;

export function useAccessSettings(organizationId: string | undefined) {
  const [memberRole, setMemberRole] = useState("member");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) return;
    let active = true;
    setError(null);
    void settingsApi.activeMemberRole(organizationId)
      .then((result) => {
        if (!active) return;
        setMemberRole(Array.isArray(result.role) ? result.role[0] ?? "member" : result.role ?? "member");
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Unable to load access settings");
      });
    return () => { active = false; };
  }, [organizationId]);

  return { memberRole, error };
}

export function AccessSettingsContent({ state }: { state: ReturnType<typeof useAccessSettings> }) {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-medium">Access</h2>
        <p className="mt-1 text-sm text-muted-foreground">Access is controlled by the organization RBAC model. There is no separate settings-level permission system.</p>
        <div className="mt-5 rounded-lg border bg-muted/30 p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Your role</p><p className="mt-1 text-lg font-semibold capitalize">{state.memberRole}</p></div>
      </section>
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-medium">Organization permissions</h2>
        <div className="mt-4 divide-y">{permissions.map(([label, resource, actions]) => <div key={resource} className="flex items-center justify-between gap-4 py-3"><div><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{resource}</p></div><span className="text-right text-xs text-muted-foreground">{actions}</span></div>)}</div>
        <p className="mt-4 text-xs text-muted-foreground">Role and resource permissions are resolved by the existing backend RBAC configuration.</p>
      </section>
      {state.error && <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{state.error}</p>}
    </div>
  );
}
