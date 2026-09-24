import { client } from "./client";

export type Project = {
  id: string;
  name: string;
  identifier: string;
  description: string | null;
  emoji: string | null;
};

export type ProjectStatus = {
  id: string;
  name: string;
  group: string;
};

export type ProjectTask = {
  id: string;
  name: string;
  description: string | null;
  priority: string;
  statusId: string;
  targetDate: string | null;
};

const projectPath = (organizationId: string, projectId?: string) =>
  projectId
    ? "/organization/" + organizationId + "/projects/" + projectId
    : "/organization/" + organizationId + "/projects";

export const projectsApi = {
  getProjects(organizationId: string) {
    return client.request<Project[]>(projectPath(organizationId));
  },
  create(organizationId: string, input: { name: string; identifier: string; description?: string }) {
    return client.request<Project>(projectPath(organizationId), {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  get(organizationId: string, projectId: string) {
    return client.request<Project>(projectPath(organizationId, projectId));
  },
  getStatuses(organizationId: string, projectId: string) {
    return client.request<ProjectStatus[]>(projectPath(organizationId, projectId) + "/statuses");
  },
  getTasks(organizationId: string, projectId: string) {
    return client.request<ProjectTask[]>(projectPath(organizationId, projectId) + "/tasks");
  },
  createTask(organizationId: string, projectId: string, input: { name: string; statusId: string }) {
    return client.request<ProjectTask>(projectPath(organizationId, projectId) + "/tasks", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  moveTask(organizationId: string, projectId: string, taskId: string, statusId: string) {
    return client.request<ProjectTask>(projectPath(organizationId, projectId) + "/tasks/" + taskId, {
      method: "PATCH",
      body: JSON.stringify({ statusId }),
    });
  },
};
