import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { administrationApi } from "@/lib/api/administration";
import { settingsApi } from "@/lib/api/settings";
import { SettingsSection, pageInput, pagePrimaryAction, pageSecondaryAction } from "@/components/workspace/page-layout";
import { WorkflowError, WorkflowSheet, useWorkflowMutation } from "@/components/workspace/workflow";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function InvitationManagement({ org }: { org: string }) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["invitations", org], queryFn: () => administrationApi.invitations(org), retry: false });
  const roles = useQuery({ queryKey: ["roles", org], queryFn: () => administrationApi.roles(org), retry: false });
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [emails, setEmails] = useState("");
  const [role, setRole] = useState("member");
  const [results, setResults] = useState<{ email: string; error?: string }[]>([]);
  const action = useWorkflowMutation([["invitations", org]]);
  const send = useWorkflowMutation([["invitations", org]]);
  const invitations = query.data?.filter((item) => item.email.toLowerCase().includes(search.toLowerCase())) ?? [];
  async function invite() {
    const addresses = [...new Set(emails.split(/[\s,;]+/).map((email) => email.trim().toLowerCase()).filter(Boolean))];
    if (!addresses.length || addresses.length > 50) throw new Error("Enter between 1 and 50 email addresses.");
    if (addresses.some((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) throw new Error("Check the email addresses before sending.");
    const outcome: { email: string; error?: string }[] = [];
    for (const email of addresses) {
      try { await settingsApi.inviteMember(org, { email, role }); outcome.push({ email }); }
      catch (error) { outcome.push({ email, error: error instanceof Error ? error.message : "Invitation failed" }); }
      setResults([...outcome]);
    }
    // Keep only failures in the composer, so retrying never re-sends successful invitations.
    setEmails(outcome.filter((item) => item.error).map((item) => item.email).join("\n"));
    await queryClient.invalidateQueries({ queryKey: ["invitations", org] });
  }
  return <SettingsSection title="Invitations" description="Create or renew invitations, then share the invitation link. Outbound invitation email is not configured."><div className="flex flex-wrap gap-3"><input className={`${pageInput} sm:max-w-xs`} aria-label="Search invitations" placeholder="Search by email" value={search} onChange={(event) => setSearch(event.target.value)} /><button className={pagePrimaryAction} onClick={() => { setResults([]); setOpen(true); }}>Invite people</button></div><WorkflowError error={query.error ?? action.error} />{query.isPending && <p className="mt-4 text-sm">Loading invitations…</p>}<div className="mt-4 divide-y">{invitations.map((invitation) => <div key={invitation.id} className="flex flex-wrap items-center gap-3 py-4"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{invitation.email}</p><p className="text-xs text-muted-foreground">{invitation.role} · {new Date(invitation.expiresAt).getTime() < Date.now() && invitation.status === "pending" ? "expired" : invitation.status} · expires {new Date(invitation.expiresAt).toLocaleDateString()}</p></div>{invitation.status === "pending" && <><button className={pageSecondaryAction} onClick={() => action.mutate(() => navigator.clipboard.writeText(`${window.location.origin}/accept-invite?${new URLSearchParams({ organizationId: org, invitationId: invitation.id })}`))}>Copy link</button><button disabled={action.isPending} className={pageSecondaryAction} onClick={() => action.mutate(() => administrationApi.invitationAction(org, invitation.id, "resend"))}>Resend</button><ConfirmDialog title="Cancel invitation?" description={`${invitation.email} will no longer be able to join using this invitation.`} confirmLabel="Cancel invitation" onConfirm={() => action.mutate(() => administrationApi.invitationAction(org, invitation.id, "cancel"))} trigger={<button disabled={action.isPending} className={pageSecondaryAction}>Cancel</button>} /></>}</div>)}</div>{!query.isPending && !query.error && !invitations.length && <p className="mt-5 text-sm text-muted-foreground">No matching invitations.</p>}
    {open && <WorkflowSheet title="Invite people" onClose={() => { if (!send.isPending) setOpen(false); }}><form className="space-y-5" onSubmit={(event) => { event.preventDefault(); send.mutate(invite); }}><label className="block space-y-2 text-sm"><span>Email addresses (up to 50)</span><textarea required rows={6} className={`${pageInput} h-auto py-3`} placeholder="One per line, or separated by commas" value={emails} onChange={(event) => setEmails(event.target.value)} /></label><label className="block space-y-2 text-sm"><span>Role</span><select className={pageInput} value={role} onChange={(event) => setRole(event.target.value)}>{["member", "admin", ...(roles.data?.map((item) => item.role) ?? [])].map((value) => <option key={value} value={value}>{value}</option>)}</select></label><WorkflowError error={send.error} /><button disabled={send.isPending} className={pagePrimaryAction}>{send.isPending ? "Creating invitations…" : "Create invitations"}</button><ul aria-live="polite" className="space-y-2 text-sm">{results.map((result) => <li key={result.email} className={result.error ? "text-destructive" : "text-muted-foreground"}>{result.email}: {result.error ?? "Invitation created"}</li>)}</ul></form></WorkflowSheet>}
  </SettingsSection>;
}
