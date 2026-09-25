import { client } from "./client";
import { projectPath, taskPath } from "./paths";

export type Project = {
  id: string;
  name: string;
  identifier: string;
  description: string | null;
  emoji: string | null;
};

export type ProjectTask = {
  id: string;
  sequenceId: number;
  name: string;
  description: string | null;
  priority: string;
  statusId: string;
  startDate: string | null;
  targetDate: string | null;
  taskAssignees?: Array<{ id: string; kind: "member" | "agent"; memberId: string | null; agentId: string | null }>;
  taskLabels?: Array<{ id: string; taskId: string; labelId: string }>;
  milestoneTasks?: Array<{ id: string; milestoneId: string; taskId: string }>;
};

export type TaskPriority = "urgent" | "high" | "medium" | "low" | "none";
export type TaskAssigneeInput = { kind: "member" | "agent"; id: string };

export type UpdateTaskInput = {
  name?: string;
  statusId?: string;
  parentId?: string;
  description?: string;
  priority?: TaskPriority;
  startDate?: string;
  targetDate?: string;
  assignees?: TaskAssigneeInput[];
  labelIds?: string[];
  milestoneIds?: string[];
};

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
  update(
    organizationId: string,
    projectId: string,
    input: { name?: string; description?: string; emoji?: string },
  ) {
    return client.request<Project>(projectPath(organizationId, projectId), {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
  delete(organizationId: string, projectId: string) {
    return client.request<null>(projectPath(organizationId, projectId), { method: "DELETE" });
  },
  getTasks(organizationId: string, projectId: string) {
    return client.request<ProjectTask[]>(taskPath(organizationId, projectId));
  },
  reorderTasks(organizationId: string, projectId: string, taskIds: string[]) {
    return client.request<ProjectTask[]>(`${taskPath(organizationId, projectId)}/reorder`, {
      method: "PATCH",
      body: JSON.stringify({ ids: taskIds }),
    });
  },
  getTask(organizationId: string, projectId: string, taskId: string) {
    return client.request<ProjectTask>(taskPath(organizationId, projectId, taskId));
  },
  createTask(organizationId: string, projectId: string, input: { name: string; statusId: string }) {
    return client.request<ProjectTask>(taskPath(organizationId, projectId), {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  updateTask(
    organizationId: string,
    projectId: string,
    taskId: string,
    input: UpdateTaskInput,
  ) {
    return client.request<ProjectTask>(taskPath(organizationId, projectId, taskId), {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
  deleteTask(organizationId: string, projectId: string, taskId: string) {
    return client.request<null>(taskPath(organizationId, projectId, taskId), {
      method: "DELETE",
    });
  },
  moveTask(organizationId: string, projectId: string, taskId: string, statusId: string) {
    return client.request<ProjectTask>(taskPath(organizationId, projectId, taskId), {
      method: "PATCH",
      body: JSON.stringify({ statusId }),
    });
  },
};
