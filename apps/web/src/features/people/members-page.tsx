import { useMemo } from "react";
import { queryKeys } from "@/lib/queryKeys";
import { useQuery } from "@tanstack/react-query";
import { hrApi, settingsApi } from "@/lib/api";
import { administrationApi } from "@/lib/api/administration";
import { useOrganization } from "@/lib/organization";
import { EmployeeProfile } from "./employee-profile";
import { MembersSection } from "./members";
import { useMemberActions } from "./member-actions";

// The member directory is its own route, not an HR tab: who is in the workspace
// is a question the whole team asks. It reuses the HR data and mutations so
// membership stays single-sourced, and `MembersSection` renders the header.
export function MembersPage({
  selectedMember,
  onSelectMember,
}: {
  selectedMember?: string;
  onSelectMember: (memberId?: string) => void;
}) {
  const { organization } = useOrganization();
  const org = organization?.id ?? "";
  const members = useQuery({
    queryKey: queryKeys.members(org),
    queryFn: () => settingsApi.members(org),
    enabled: !!org,
  });
  const profiles = useQuery({
    queryKey: queryKeys.memberProfiles(org),
    queryFn: () => hrApi.getMemberProfiles(org),
    enabled: !!org,
    retry: false,
  });
  const roles = useQuery({
    queryKey: ["roles", org],
    queryFn: () => administrationApi.roles(org),
    enabled: !!org,
    retry: false,
  });
  const memberActions = useMemberActions(org);
  const profileByMember = useMemo(
    () => new Map((profiles.data ?? []).map((profile) => [profile.memberId, profile])),
    [profiles.data],
  );
  const selected = members.data?.members.find((member) => member.id === selectedMember);

  if (!org) return <p className="p-8">Select a workspace first.</p>;

  return (
    <>
      <MembersSection
        members={members.data?.members ?? []}
        loadingMembers={members.isPending}
        inviteEmail={memberActions.inviteEmail}
        inviteRole={memberActions.inviteRole}
        busyMember={memberActions.busyMember}
        roles={roles.data?.map((role) => role.role)}
        error={memberActions.error}
        profileByMember={profileByMember}
        onInviteEmailChange={memberActions.onInviteEmailChange}
        onInviteRoleChange={memberActions.onInviteRoleChange}
        onInvite={memberActions.onInvite}
        onRoleChange={memberActions.onRoleChange}
        onRemove={memberActions.onRemove}
        onOpenProfile={onSelectMember}
      />
      {selected && (
        <EmployeeProfile
          key={selected.id}
          org={org}
          member={selected}
          onClose={() => onSelectMember(undefined)}
        />
      )}
    </>
  );
}
