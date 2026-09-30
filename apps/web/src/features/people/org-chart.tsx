import { useQuery } from "@tanstack/react-query";
import { IconHierarchy } from "@tabler/icons-react";
import { hrApi, type OrganizationMember } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { HrSection } from "./hr-section";

export function OrganizationChart({
  org,
  name,
  members,
  onSelect,
}: {
  org: string;
  name: string;
  members: OrganizationMember[];
  onSelect: (id: string) => void;
}) {
  const query = useQuery({
    queryKey: queryKeys.departments(org),
    queryFn: () => hrApi.getDepartments(org),
    retry: false,
  });
  const departments = query.data ?? [];
  const assigned = new Set(
    departments.flatMap((department) => department.members.map((member) => member.id)),
  );
  const groups = [
    ...departments.map((department) => ({
      id: department.id,
      name: department.name,
      members: members.filter((member) =>
        department.members.some((person) => person.id === member.id),
      ),
    })),
    {
      id: "unassigned",
      name: "No department",
      members: members.filter((member) => !assigned.has(member.id)),
    },
  ];
  return (
    <HrSection
      error={query.error}
      loading={query.isPending}
      loadingLabel="Loading organization chart..."
      empty={
        groups.every((group) => !group.members.length)
          ? {
              icon: IconHierarchy,
              title: "Nobody to place yet",
              description:
                "Invite people, or assign them to a department, and they will appear here.",
            }
          : null
      }
    >
      <div className="overflow-x-auto pb-3">
        <div className="mx-auto w-max min-w-full">
          <div className="mx-auto w-fit rounded-xl bg-primary px-6 py-4 text-center text-sm font-semibold text-primary-foreground">
            {name}
            <p className="mt-1 text-xs font-normal">{members.length} people</p>
          </div>
          <div className="mx-auto h-8 w-px bg-border" />
          <ul className="flex justify-center gap-6 border-t pt-8">
            {groups
              .filter((g) => g.id !== "unassigned" || g.members.length)
              .map((group) => (
                <li
                  key={group.id}
                  className="relative w-56 shrink-0 before:absolute before:-top-8 before:left-1/2 before:h-8 before:w-px before:bg-border"
                >
                  <h2 className="rounded-xl border bg-muted/40 p-4 text-sm font-medium">
                    {group.name}{" "}
                    <span className="text-xs text-muted-foreground">({group.members.length})</span>
                  </h2>
                  <ul className="ml-4 border-l pl-4">
                    {group.members.map((member) => (
                      <li key={member.id} className="pt-3">
                        <button
                          className="w-full rounded-xl border bg-card p-3 text-left text-xs transition-colors hover:border-primary"
                          onClick={() => onSelect(member.id)}
                        >
                          {[member.firstName, member.lastName].filter(Boolean).join(" ") ||
                            member.user?.name ||
                            "Name not set"}
                          <span className="mt-1 block capitalize text-muted-foreground">
                            {member.role}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  {!group.members.length && (
                    <p className="p-4 text-xs text-muted-foreground">No members assigned.</p>
                  )}
                </li>
              ))}
          </ul>
        </div>
      </div>
    </HrSection>
  );
}
