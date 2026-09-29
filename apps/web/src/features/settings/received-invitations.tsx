import { useQuery } from "@tanstack/react-query";
import { administrationApi } from "@/lib/api/administration";
import { queryKeys } from "@/lib/queryKeys";
import { ApiError } from "@/lib/api/errors";
import { pagePrimaryAction, pageSecondaryAction } from "@/components/workspace/page-layout";
import { WorkflowError, useWorkflowMutation } from "@/components/workspace/workflow";

export function ReceivedInvitations() {
  const invitations = useQuery({ queryKey: ["received-invitations"], queryFn: administrationApi.received, retry: false });
  const action = useWorkflowMutation([["received-invitations"], queryKeys.organizations]);
  const pending = invitations.data?.filter((item) => item.status === "pending" && new Date(item.expiresAt).getTime() > Date.now()) ?? [];
  if (!pending.length && !invitations.error) return null;
  if (invitations.error instanceof ApiError && invitations.error.status === 403) return <p className="mt-5 text-sm text-muted-foreground">The invitation inbox requires a verified email. You can still open the invitation link shared by your workspace owner.</p>;
  return <section className="mt-6 rounded-2xl border bg-card p-5"><h2 className="text-sm font-semibold">Your invitations</h2><WorkflowError error={invitations.error ?? action.error} />{pending.map((invitation) => <div key={invitation.id} className="flex flex-wrap items-center gap-3 border-b py-4 last:border-0"><div className="flex-1"><p className="text-sm">{invitation.organizationName ?? "Workspace invitation"}</p><p className="text-xs text-muted-foreground">Join as {invitation.role}</p></div><button className={pagePrimaryAction} disabled={action.isPending} onClick={() => action.mutate(() => administrationApi.invitationAction(invitation.organizationId, invitation.id, "accept"))}>Accept</button><button className={pageSecondaryAction} disabled={action.isPending} onClick={() => action.mutate(() => administrationApi.invitationAction(invitation.organizationId, invitation.id, "reject"))}>Decline</button></div>)}</section>;
}
