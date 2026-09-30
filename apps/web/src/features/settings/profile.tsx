import { ImageUpload } from "@/components/workspace/image-upload";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/lib/session";
import { settingsApi } from "@/lib/api/settings";
import { queryKeys } from "@/lib/queryKeys";
import { SettingsSection } from "@/components/workspace/page-layout";
import {
  WorkflowField,
  WorkflowError,
  WorkflowSubmit,
  useWorkflowMutation,
} from "@/components/workspace/workflow";

export function ProfileSettings({ organizationId }: { organizationId: string }) {
  const session = useSession();
  const queryClient = useQueryClient();
  const members = useQuery({
    queryKey: queryKeys.members(organizationId),
    queryFn: () => settingsApi.members(organizationId),
    enabled: Boolean(organizationId),
    retry: false,
  });
  const userId = session.data?.user?.id;
  const member = members.data?.members.find((m) => m.userId === userId);

  if (session.isPending || members.isPending)
    return <p className="text-sm">Loading your profile…</p>;
  if (session.error) return <WorkflowError error={session.error} />;
  if (!session.data?.user) return null;

  return (
    <ProfileForm
      key={session.data.user.id}
      organizationId={organizationId}
      user={session.data.user}
      member={member}
      onSaved={async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.members(organizationId) }),
          queryClient.invalidateQueries({ queryKey: queryKeys.user.current(organizationId) }),
        ]);
      }}
    />
  );
}

function ProfileForm({
  organizationId,
  user,
  member,
  onSaved,
}: {
  organizationId: string;
  user: { email?: string | null };
  member?: { firstName?: string | null; lastName?: string | null; avatar?: string | null };
  onSaved: () => Promise<void>;
}) {
  const [firstName, setFirstName] = useState(member?.firstName ?? "");
  const [lastName, setLastName] = useState(member?.lastName ?? "");
  const [image, setImage] = useState(member?.avatar ?? "");
  const [saved, setSaved] = useState(false);
  const save = useWorkflowMutation([queryKeys.session], async () => {
    setSaved(true);
    await onSaved();
  });

  return (
    <SettingsSection
      title="Your profile"
      description="This is the name and photo your teammates see in this workspace."
    >
      <form
        className="max-w-lg space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          setSaved(false);
          save.mutate(async () => {
            await settingsApi.updateProfile(organizationId, {
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              avatar: image || null,
            });
          });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <WorkflowField
            label="First name"
            required
            maxLength={100}
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
          />
          <WorkflowField
            label="Last name"
            required
            maxLength={100}
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
        </div>
        <WorkflowField label="Email" type="email" value={user.email ?? ""} readOnly />
        <ImageUpload label="Profile photo" shape="circle" value={image} onChange={setImage} />
        <WorkflowError error={save.error} />
        <WorkflowSubmit pending={save.isPending} />
        {saved && (
          <p role="status" className="text-sm text-muted-foreground">
            Profile updated.
          </p>
        )}
      </form>
    </SettingsSection>
  );
}
