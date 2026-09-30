import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { administrationApi } from "@/lib/api/administration";
import { useSession } from "@/lib/session";
import { queryKeys } from "@/lib/queryKeys";
import { WorkflowError, useWorkflowMutation } from "@/components/workspace/workflow";
import { pagePrimaryAction, pageSecondaryAction } from "@/components/workspace/page-layout";
import { Brand } from "@/components/ui/brand";

export const Route = createFileRoute("/accept-invite")({
  validateSearch: (
    input: Record<string, unknown>,
  ): { organizationId?: string; invitationId?: string } => ({
    organizationId: typeof input.organizationId === "string" ? input.organizationId : undefined,
    invitationId: typeof input.invitationId === "string" ? input.invitationId : undefined,
  }),
  component: AcceptInvitation,
});
function AcceptInvitation() {
  const { organizationId: org, invitationId: id } = Route.useSearch();
  const session = useSession();
  const navigate = useNavigate();
  const invitation = useQuery({
    queryKey: ["invitation", org, id],
    queryFn: () => administrationApi.invitation(org!, id!),
    enabled: !!org && !!id && !!session.data?.user,
    retry: false,
  });
  const mutation = useWorkflowMutation([queryKeys.organizations, ["received-invitations"]], () => {
    void navigate({ to: "/workspaces" });
  });
  const remember = () =>
    sessionStorage.setItem(
      "teamlyf:invitation-return",
      `/accept-invite?${new URLSearchParams({ organizationId: org!, invitationId: id! })}`,
    );
  return (
    <main className="grid min-h-svh place-items-center bg-background px-4">
      <section className="w-full max-w-lg space-y-6 rounded-2xl border bg-card p-8">
        <Brand />
        <h1 className="text-2xl font-semibold">Workspace invitation</h1>
        {!org || !id ? (
          <p role="alert">
            This invitation link is incomplete. Ask the workspace owner for a new link.
          </p>
        ) : session.isPending ? (
          <p>Checking your session…</p>
        ) : !session.data?.user ? (
          <>
            <p className="text-sm text-muted-foreground">
              Sign in with the email address this invitation was sent to.
            </p>
            <div className="flex gap-3">
              <Link className={pagePrimaryAction} to="/sign-in" onClick={remember}>
                Sign in
              </Link>
              <Link className={pageSecondaryAction} to="/sign-up" onClick={remember}>
                Create account
              </Link>
            </div>
          </>
        ) : (
          <>
            <WorkflowError error={invitation.error ?? mutation.error} />
            {invitation.isPending && <p>Loading invitation…</p>}
            {invitation.data && (
              <>
                <p className="text-sm">
                  Join {invitation.data.organizationName ?? "this workspace"} as{" "}
                  {invitation.data.role}.
                </p>
                <p className="text-xs text-muted-foreground">
                  For {invitation.data.email} · expires{" "}
                  {new Date(invitation.data.expiresAt).toLocaleDateString()}
                </p>
                {invitation.data.status === "pending" &&
                new Date(invitation.data.expiresAt).getTime() > Date.now() ? (
                  <div className="flex gap-3">
                    <button
                      disabled={mutation.isPending}
                      className={pagePrimaryAction}
                      onClick={() =>
                        mutation.mutate(() => administrationApi.invitationAction(org, id, "accept"))
                      }
                    >
                      Accept invitation
                    </button>
                    <button
                      disabled={mutation.isPending}
                      className={pageSecondaryAction}
                      onClick={() =>
                        mutation.mutate(() => administrationApi.invitationAction(org, id, "reject"))
                      }
                    >
                      Decline
                    </button>
                  </div>
                ) : (
                  <p>
                    This invitation is no longer pending. Ask the workspace owner for a new
                    invitation.
                  </p>
                )}
              </>
            )}
          </>
        )}
        <Link className="block text-sm text-primary" to="/workspaces">
          Back to workspaces
        </Link>
      </section>
    </main>
  );
}
