import { useState } from "react";
import { queryKeys } from "@/lib/queryKeys";
import { useQuery } from "@tanstack/react-query";
import { hrApi, type MemberProfile, type OrganizationMember } from "@/lib/api";
import { WorkflowError, WorkflowField, WorkflowSheet, WorkflowSubmit, useWorkflowMutation } from "@/components/workspace/workflow";

export function EmployeeProfile({ org, member, onClose }: { org: string; member: OrganizationMember; onClose: () => void }) {
  const profile = useQuery({ queryKey: ["hr-profile", org, member.id], queryFn: () => hrApi.getProfile(org, member.id), retry: false });
  const contact = useQuery({ queryKey: ["emergency-contact", org, member.id], queryFn: () => hrApi.getEmergencyContact(org, member.id), retry: false });
  return <WorkflowSheet title={member.user?.name || "Employee profile"} description={member.user?.email || "Employment and emergency information"} onClose={onClose}>
    <WorkflowError error={profile.error || contact.error} />
    {profile.isPending ? <p>Loading profile…</p> : !profile.error && <ProfileForm org={org} member={member.id} profile={profile.data} />}
    {contact.isSuccess && <ContactForm org={org} member={member.id} contact={contact.data} />}
  </WorkflowSheet>;
}

function ProfileForm({ org, member, profile }: { org: string; member: string; profile?: MemberProfile | null }) {
  const [saved, setSaved] = useState(false);
  const mutation = useWorkflowMutation([["hr-profile", org, member], queryKeys.memberProfiles(org)], () => setSaved(true));
  return <form className="space-y-4" onChange={() => setSaved(false)} onSubmit={(event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = (key: string) => String(data.get(key) ?? "").trim();
    mutation.mutate(() => hrApi.updateProfile(org, member, { employeeNumber: text("employeeNumber"), jobTitle: text("jobTitle"), employmentType: text("employmentType"), status: text("status"), phone: text("phone"), address: text("address"), ...(text("startDate") ? { startDate: text("startDate") } : {}) }));
  }}>
    <h2 className="text-sm font-semibold">Employment and contact</h2>
    <WorkflowField label="Employee number" name="employeeNumber" defaultValue={profile?.employeeNumber ?? ""} />
    <WorkflowField label="Job title" name="jobTitle" defaultValue={profile?.jobTitle ?? ""} />
    <WorkflowField label="Employment type" name="employmentType" required defaultValue={profile?.employmentType ?? "full_time"} />
    <WorkflowField label="Status" name="status" required defaultValue={profile?.status ?? "active"} />
    <WorkflowField label="Start date" name="startDate" type="date" defaultValue={profile?.startDate?.slice(0, 10) ?? ""} />
    <WorkflowField label="Phone" name="phone" type="tel" defaultValue={profile?.phone ?? ""} />
    <WorkflowField label="Address" name="address" defaultValue={profile?.address ?? ""} />
    <WorkflowError error={mutation.error} /><WorkflowSubmit pending={mutation.isPending} />{saved && <p role="status" className="text-sm text-emerald-600">Profile saved.</p>}
  </form>;
}

function ContactForm({ org, member, contact }: { org: string; member: string; contact: { name: string | null; phone: string | null } }) {
  const mutation = useWorkflowMutation([["emergency-contact", org, member]]);
  return <form className="mt-8 space-y-4 border-t pt-6" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); mutation.mutate(() => hrApi.updateEmergencyContact(org, member, { name: String(data.get("name")).trim(), phone: String(data.get("phone")).trim() })); }}>
    <h2 className="text-sm font-semibold">Emergency contact</h2><WorkflowField label="Contact name" name="name" required maxLength={100} defaultValue={contact.name ?? ""} /><WorkflowField label="Contact phone" name="phone" type="tel" required maxLength={50} defaultValue={contact.phone ?? ""} /><WorkflowError error={mutation.error} /><WorkflowSubmit pending={mutation.isPending} label="Save emergency contact" />{mutation.isSuccess && <p role="status" className="text-sm text-emerald-600">Contact saved.</p>}
  </form>;
}
