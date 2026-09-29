import { ImageUpload } from "@/components/workspace/image-upload";
import { useState } from "react";
import { useSession } from "@/lib/session";
import { updateUser } from "@/lib/api/auth";
import { queryKeys } from "@/lib/queryKeys";
import { SettingsSection } from "@/components/workspace/page-layout";
import { WorkflowField, WorkflowError, WorkflowSubmit, useWorkflowMutation } from "@/components/workspace/workflow";

export function ProfileSettings() {
  const session = useSession();
  if (session.isPending) return <p className="text-sm">Loading profile…</p>;
  if (session.error) return <WorkflowError error={session.error} />;
  if (!session.data?.user) return null;
  return <ProfileForm key={session.data.user.id} user={session.data.user} />;
}

function ProfileForm({ user }: { user: { name?: string | null; email?: string | null; image?: string | null } }) {
  const [name, setName] = useState(user.name ?? "");
  const [image, setImage] = useState(user.image ?? "");
  const [saved, setSaved] = useState(false);
  const save = useWorkflowMutation([queryKeys.session], () => setSaved(true));
  return <SettingsSection title="Your profile" description="Your profile is shared across your workspaces."><form className="max-w-lg space-y-5" onSubmit={(event) => { event.preventDefault(); setSaved(false); save.mutate(() => updateUser({ name: name.trim(), image })); }}><WorkflowField label="Display name" required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} /><WorkflowField label="Email" type="email" value={user.email ?? ""} readOnly /><ImageUpload label="Profile photo" value={image} onChange={setImage} /><WorkflowError error={save.error} /><WorkflowSubmit pending={save.isPending} />{saved && <p role="status" className="text-sm text-muted-foreground">Profile updated.</p>}</form></SettingsSection>;
}
