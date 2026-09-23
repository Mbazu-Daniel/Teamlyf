import { client } from "../api";

export type Employee = {
  id: string;
  memberId: string;
  status: string;
  departmentId: string | null;
};

const path = (organizationId: string, suffix = "") =>
  "/organization/" + organizationId + "/hr" + suffix;

export const hrApi = {
  employees(organizationId: string) {
    return client.request<Employee[]>(path(organizationId, "/employees"));
  },
};
