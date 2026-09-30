import { useState, type FormEventHandler } from "react";
import { toast } from "sonner";
import { useWorkflowMutation } from "@/components/workspace/workflow";
import { queryKeys } from "@/lib/queryKeys";
import { settingsApi } from "@/lib/api";

export function useMemberActions(org: string) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [busyMember, setBusyMember] = useState<string | null>(null);
  const invite = useWorkflowMutation([queryKeys.members(org), ["invitations", org]], () => {
    setInviteEmail("");
    toast.success("Invitation sent");
  });
  const memberAction = useWorkflowMutation([queryKeys.members(org)]);

  const onInvite: FormEventHandler = (event) => {
    event.preventDefault();
    const email = inviteEmail.trim();
    if (!org || !email) return;
    invite.mutate(() => settingsApi.inviteMember(org, { email, role: inviteRole }));
  };

  function onRoleChange(memberId: string, role: string) {
    setBusyMember(memberId);
    memberAction.mutate(() => settingsApi.updateMemberRole(org, memberId, role), {
      onSettled: () => setBusyMember(null),
    });
  }

  function onRemove(memberId: string) {
    setBusyMember(memberId);
    memberAction.mutate(() => settingsApi.removeMember(org, memberId), {
      onSettled: () => setBusyMember(null),
    });
  }

  return {
    inviteEmail,
    inviteRole,
    busyMember: invite.isPending ? "invite" : busyMember,
    error: invite.error ?? memberAction.error,
    onInviteEmailChange: setInviteEmail,
    onInviteRoleChange: setInviteRole,
    onInvite,
    onRoleChange,
    onRemove,
  };
}
