import { queryKeys } from "@/lib/queryKeys";
import { useQuery } from "@tanstack/react-query";
import { settingsApi } from "@/lib/api";
import { useOrganization } from "@/lib/organization";
import { EmployeeProfile } from "./employee-profile";
import { HrNav } from "./hr-nav";
import { OrganizationChart } from "./org-chart";
import { Departments } from "./departments";
import { LeaveManagement } from "./leave-management";

export function PeoplePage({
  section,
  selectedMember,
  onNavigate,
}: {
  section: string;
  selectedMember?: string;
  onNavigate: (section: string, member?: string) => void;
}) {
  const { organization } = useOrganization();
  const org = organization?.id ?? "";
  const members = useQuery({
    queryKey: queryKeys.members(org),
    queryFn: () => settingsApi.members(org),
    enabled: !!org,
  });
  const selected = members.data?.members.find((m) => m.id === selectedMember);
  /** Opens a person's HR profile without leaving the section it was opened from. */
  const onOpenProfile = (memberId: string) => onNavigate(section, memberId);
  if (!org) return <p className="p-8">Select a workspace first.</p>;
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1440px] flex-col px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[18px] border border-border/70 bg-card">
          <HrNav selected={section} onSelect={onNavigate} />
          <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
            <div className="space-y-6 p-4 sm:p-6 lg:p-7">
              {section === "org-chart" && (
                <OrganizationChart
                  org={org}
                  name={organization?.name ?? "Workspace"}
                  members={members.data?.members ?? []}
                  onSelect={onOpenProfile}
                />
              )}
              {section === "departments" && (
                <Departments org={org} members={members.data?.members ?? []} />
              )}
              {section === "leave" && (
                <LeaveManagement org={org} members={members.data?.members ?? []} />
              )}
              {selected && (
                <EmployeeProfile
                  key={selected.id}
                  org={org}
                  member={selected}
                  onClose={() => onNavigate("members")}
                />
              )}
              {selectedMember && !selected && !members.isPending && (
                <p role="alert">Employee not found in this workspace.</p>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
