import { useQueries, useQuery } from "@tanstack/react-query";
import { hrApi, projectsApi, settingsApi, statusesApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/error-message";
import { queryKeys } from "@/lib/queryKeys";
import { useGetCurrentUser } from "@/features/chat/data/queries/use-get-current-user-hook";
import {
  buildWorkspaceRows,
  dueSoonRows,
  kpiTiles,
  projectRollups,
  statusDistribution,
  todaysRows,
  throughputSummary,
  weeklyThroughput,
} from "./dashboard-metrics";

/**
 * Everything the overview reads. Tasks and statuses come from the same cache
 * keys the project boards use, so opening a board after the dashboard is free.
 *
 * HR reads are permission-gated (`hr:read`): a viewer gets 403, which must show
 * up as a quiet panel and never as a failed dashboard.
 */
export function useDashboard(organizationId: string | undefined) {
  const organizationKey = organizationId ?? "";
  const enabled = Boolean(organizationId);

  const projectsQuery = useQuery({
    queryKey: queryKeys.projects(organizationKey),
    queryFn: () => projectsApi.getProjects(organizationKey),
    enabled,
    retry: false,
  });
  const projects = projectsQuery.data ?? [];

  const taskQueries = useQueries({
    queries: projects.map((project) => ({
      queryKey: queryKeys.tasks(organizationKey, project.id),
      queryFn: () => projectsApi.getTasks(organizationKey, project.id),
      enabled,
      retry: false,
    })),
  });
  const statusQueries = useQueries({
    queries: projects.map((project) => ({
      queryKey: queryKeys.statuses(organizationKey, project.id),
      queryFn: () => statusesApi.getStatuses(organizationKey, project.id),
      enabled,
      retry: false,
    })),
  });

  const member = useGetCurrentUser(organizationId ?? null);
  const membersQuery = useQuery({
    queryKey: queryKeys.members(organizationKey),
    queryFn: () => settingsApi.members(organizationKey),
    enabled,
    retry: false,
  });
  const departmentsQuery = useQuery({
    queryKey: queryKeys.departments(organizationKey),
    queryFn: () => hrApi.getDepartments(organizationKey),
    enabled,
    retry: false,
  });
  const leaveQuery = useQuery({
    queryKey: queryKeys.leaveRequests(organizationKey),
    queryFn: () => hrApi.getLeaveRequests(organizationKey),
    enabled,
    retry: false,
  });
  const balancesQuery = useQuery({
    queryKey: queryKeys.leaveBalances(organizationKey),
    queryFn: () => hrApi.getLeaveBalances(organizationKey),
    enabled,
    retry: false,
  });

  const rows = buildWorkspaceRows({
    projects,
    tasksByProject: taskQueries.map((result) => result.data),
    statusesByProject: statusQueries.map((result) => result.data),
  });
  const throughput = weeklyThroughput(rows);
  const memberId = member.data?.id;
  const departments = departmentsQuery.data ?? [];
  const requests = leaveQuery.data ?? [];
  const assignedToDepartment = new Set(departments.flatMap((item) => item.members.map((m) => m.id)));

  return {
    loading: projectsQuery.isLoading || taskQueries.some((result) => result.isPending),
    error: getErrorMessage(projectsQuery.error, "Unable to load projects"),
    kpis: kpiTiles(projects, rows, { memberId }),
    distribution: statusDistribution(rows),
    rollups: projectRollups(projects, rows),
    throughput,
    throughputLabel: throughputSummary(throughput),
    today: todaysRows(rows, memberId),
    dueSoon: dueSoonRows(rows),
    taskCount: rows.length,
    team: {
      memberCount: membersQuery.data?.members.length ?? 0,
      departmentCount: departments.length,
      unassignedCount: (membersQuery.data?.members ?? []).filter((item) => !assignedToDepartment.has(item.id)).length,
      error: getErrorMessage(membersQuery.error ?? departmentsQuery.error, null),
    },
    leave: {
      balances: balancesQuery.data ?? [],
      pending: requests.filter((request) => request.status === "pending").length,
      upcoming: requests.filter((request) => request.status === "approved").length,
      error: getErrorMessage(leaveQuery.error ?? balancesQuery.error, null),
    },
  };
}

export type DashboardState = ReturnType<typeof useDashboard>;
