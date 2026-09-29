import { useState } from "react";
import { client } from "@/lib/api/client";
import { useSession } from "@/lib/session";
import { SettingsSection, pageSecondaryAction } from "@/components/workspace/page-layout";
import { WorkflowSheet, WorkflowField, WorkflowSubmit, WorkflowError, useWorkflowMutation } from "@/components/workspace/workflow";

export function DeleteAccount() {
  const session = useSession();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const mutation = useWorkflowMutation([], () => { window.location.assign("/"); });
  return <SettingsSection title="Delete account" description="Permanently delete your sign-in profile and sessions. First transfer ownership or delete owned workspaces, and ask workspace administrators to remove your remaining memberships."><button className={`${pageSecondaryAction} text-destructive`} onClick={() => setOpen(true)}>Delete account…</button>{open && <WorkflowSheet title="Delete your account permanently" onClose={() => { if (!mutation.isPending) setOpen(false); }}><form className="space-y-5" onSubmit={(event) => { event.preventDefault(); if (email !== session.data?.user?.email) return; mutation.mutate(() => client.request("/auth/delete-user", { method: "POST", body: JSON.stringify({ password: password || undefined }) })); }}><p className="text-sm text-muted-foreground">This cannot be undone. Type your email to confirm. Enter your password, or sign in again first if you use Google. Workspace records are managed separately; this is not a workspace-data erasure request.</p><WorkflowField label="Confirm email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /><WorkflowField label="Current password (email accounts)" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /><WorkflowError error={mutation.error} /><WorkflowSubmit pending={mutation.isPending || !email || email !== session.data?.user?.email} label="Delete permanently" /></form></WorkflowSheet>}</SettingsSection>;
}
