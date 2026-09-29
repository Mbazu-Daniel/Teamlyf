import { client } from "./client";

/**
 * HR endpoints are organization-scoped and permission-gated server-side
 * (`hr:read` / `hr:create` / `hr:update`), so every reader below must tolerate a
 * 403 by a viewer account instead of treating it as a broken page.
 */
const departmentPath = (organizationId: string, departmentId?: string, suffix = "") =>
  `/organization/${organizationId}/departments${departmentId ? `/${departmentId}` : ""}${suffix}`;
const leavePath = (organizationId: string, requestId?: string) =>
  `/organization/${organizationId}/leave${requestId ? `/${requestId}` : ""}`;
const policyPath = (organizationId: string) => `/organization/${organizationId}/policies`;
const balancePath = (organizationId: string) => `/organization/${organizationId}/leave-balances`;
const profilesPath = (organizationId: string) => `/organization/${organizationId}/profiles`;

export type DepartmentMember = {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
};

export type Department = {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  members: DepartmentMember[];
};

export type LeavePolicy = {
  id: string;
  name: string;
  daysPerYear: number;
  createdAt: string;
};

type LeaveRequestStatus = "pending" | "approved" | "rejected" | "cancelled";

type LeaveRequest = {
  id: string;
  memberId: string;
  policyId: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: LeaveRequestStatus;
  reviewedById: string | null;
  reviewedAt: string | null;
  reviewReason?: string | null;
  createdAt: string;
};

type LeaveBalance = {
  policyId: string;
  policyName: string;
  daysPerYear: number;
  usedDays: number;
  remainingDays: number;
};

export type MemberProfile = {
  memberId: string;
  organizationId: string;
  employeeNumber: string | null;
  jobTitle: string | null;
  employmentType: string;
  status: string;
  startDate: string | null;
  phone: string | null;
  address: string | null;
};

const json = (body: unknown): RequestInit => ({
  method: "POST",
  body: JSON.stringify(body),
});

export const hrApi = {
  updateDepartment: (org: string, id: string, input: { name: string; description?: string }) => client.request<Department>(departmentPath(org, id), { method: "PATCH", body: JSON.stringify(input) }),
  deleteDepartment: (org: string, id: string) => client.request<void>(departmentPath(org, id), { method: "DELETE" }),
  createPolicy: (org: string, input: { name: string; daysPerYear: number }) => client.request<LeavePolicy>(policyPath(org), json(input)),
  updatePolicy: (org: string, id: string, input: { name: string; daysPerYear: number }) => client.request<LeavePolicy>(`${policyPath(org)}/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deletePolicy: (org: string, id: string) => client.request<void>(`${policyPath(org)}/${id}`, { method: "DELETE" }),
  getReviewQueue: (org: string) => client.request<LeaveRequest[]>(`${leavePath(org)}/review`),
  getProfile: (org: string, member: string) => client.request<MemberProfile | null>(`${profilesPath(org)}/${member}`),
  updateProfile: (org: string, member: string, input: Partial<Omit<MemberProfile, "memberId" | "organizationId">>) => client.request<MemberProfile>(`${profilesPath(org)}/${member}`, { method: "PATCH", body: JSON.stringify(input) }),
  getEmergencyContact: (org: string, member: string) => client.request<{ name: string | null; phone: string | null }>(`/organization/${org}/members/${member}/emergency-contact`),
  updateEmergencyContact: (org: string, member: string, input: { name: string; phone: string }) => client.request<unknown>(`/organization/${org}/members/${member}/emergency-contact`, { method: "PATCH", body: JSON.stringify(input) }),
  getDepartments: (organizationId: string) =>
    client.request<Department[]>(departmentPath(organizationId)),
  createDepartment: (organizationId: string, input: { name: string; description?: string }) =>
    client.request<Department>(departmentPath(organizationId), json(input)),
  addDepartmentMember: (organizationId: string, departmentId: string, memberId: string) =>
    client.request<unknown>(departmentPath(organizationId, departmentId, `/members/${memberId}`), {
      method: "POST",
    }),
  removeDepartmentMember: (organizationId: string, departmentId: string, memberId: string) =>
    client.request<unknown>(
      departmentPath(organizationId, departmentId, `/members/${memberId}`),
      { method: "DELETE" },
    ),
  getLeaveRequests: (organizationId: string) =>
    client.request<LeaveRequest[]>(leavePath(organizationId)),
  createLeaveRequest: (
    organizationId: string,
    input: { policyId: string; startDate: string; endDate: string; reason?: string },
  ) => client.request<LeaveRequest>(leavePath(organizationId), json(input)),
  reviewLeaveRequest: (organizationId: string, requestId: string, status: "approved" | "rejected", reviewReason?: string) =>
    client.request<LeaveRequest>(leavePath(organizationId, requestId), {
      method: "PATCH",
      body: JSON.stringify({ status, reviewReason }),
    }),
  cancelLeaveRequest: (organizationId: string, requestId: string) =>
    client.request<LeaveRequest>(leavePath(organizationId, requestId), { method: "DELETE" }),
  getLeaveBalances: (organizationId: string) =>
    client.request<LeaveBalance[]>(balancePath(organizationId)),
  getLeavePolicies: (organizationId: string) =>
    client.request<LeavePolicy[]>(policyPath(organizationId)),
  getMemberProfiles: (organizationId: string) =>
    client.request<MemberProfile[]>(profilesPath(organizationId)),
};
