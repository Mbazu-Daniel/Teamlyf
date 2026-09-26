import { client } from "./client";
import { projectPath, taskPath } from "./paths";

export type Project = { id: string; name: string; createdAt?: string; updatedAt?: string; identifier: string; description: string | null; emoji: string | null; code?: string | null; image?: string | null; coverImageURL?: string | null; status?: string | null; members?: Array<{ id: string; firstName?: string; lastName?: string; user?: { image?: string | null } }>; leads?: Array<{ id: string; firstName?: string; lastName?: string; user?: { image?: string | null } }>; leadIds?: string[] };
export type ProjectTask = { id: string; sequenceId: number; name: string; description: string | null; priority: string; statusId: string; startDate: string | null; targetDate: string | null; taskAssignees?: Array<{ id: string; kind: "member" | "agent"; memberId: string | null; agentId: string | null }>; taskLabels?: Array<{ id: string; taskId: string; labelId: string }>; milestoneTasks?: Array<{ id: string; milestoneId: string; taskId: string }> };
type ProjectMember = { id: string; projectId: string; memberId: string; role: string; member: { id: string; firstName?: string | null; lastName?: string | null; user?: { name?: string | null; email?: string | null } | null } };
export type Sprint = { id: string; projectId: string; organizationId: string; name: string; startDate: string | null; endDate: string | null; status: string };
export type TaskAttachment = { id: string; taskId: string; memberId: string; name: string; url: string; mimeType: string | null; size: string | null; createdAt: string };
export type TaskPriority = "urgent" | "high" | "medium" | "low" | "none";
export type TaskAssigneeInput = { kind: "member" | "agent"; id: string };
export type UpdateTaskInput = { name?: string; statusId?: string; parentId?: string; description?: string; priority?: TaskPriority; startDate?: string; targetDate?: string; assignees?: TaskAssigneeInput[]; labelIds?: string[]; milestoneIds?: string[] };

export const projectMembersApi = {
  get: (organizationId: string, projectId: string) => client.request<ProjectMember[]>(`${projectPath(organizationId, projectId)}/members`),
  add: (organizationId: string, projectId: string, memberIds: string[]) => client.request<ProjectMember[]>(`${projectPath(organizationId, projectId)}/members`, { method: "POST", body: JSON.stringify({ memberIds }) }),
  remove: (organizationId: string, projectId: string, memberId: string) => client.request<{ success: boolean }>(`${projectPath(organizationId, projectId)}/members/${memberId}`, { method: "DELETE" }),
};

export const projectsApi = {
  getProjects: (organizationId: string) => client.request<Project[]>(projectPath(organizationId)),
  create: (organizationId: string, input: { name: string; identifier: string; description?: string }) => client.request<Project>(projectPath(organizationId), { method: "POST", body: JSON.stringify(input) }),
  get: (organizationId: string, projectId: string) => client.request<Project>(projectPath(organizationId, projectId)),
  update: (organizationId: string, projectId: string, input: { name?: string; description?: string; emoji?: string }) => client.request<Project>(projectPath(organizationId, projectId), { method: "PATCH", body: JSON.stringify(input) }),
  delete: (organizationId: string, projectId: string) => client.request<null>(projectPath(organizationId, projectId), { method: "DELETE" }),
  getTasks: (organizationId: string, projectId: string) => client.request<ProjectTask[]>(taskPath(organizationId, projectId)),
  reorderTasks: (organizationId: string, projectId: string, taskIds: string[]) => client.request<ProjectTask[]>(`${taskPath(organizationId, projectId)}/reorder`, { method: "PATCH", body: JSON.stringify({ ids: taskIds }) }),
  getTask: (organizationId: string, projectId: string, taskId: string) => client.request<ProjectTask>(taskPath(organizationId, projectId, taskId)),
  createTask: (organizationId: string, projectId: string, input: { name: string; statusId: string }) => client.request<ProjectTask>(taskPath(organizationId, projectId), { method: "POST", body: JSON.stringify(input) }),
  updateTask: (organizationId: string, projectId: string, taskId: string, input: UpdateTaskInput) => client.request<ProjectTask>(taskPath(organizationId, projectId, taskId), { method: "PATCH", body: JSON.stringify(input) }),
  updateTaskStatus: (organizationId: string, projectId: string, taskId: string, statusId: string) => client.request<ProjectTask>(`${taskPath(organizationId, projectId, taskId)}/status`, { method: "PATCH", body: JSON.stringify({ statusId }) }),
  assignTask: (organizationId: string, projectId: string, taskId: string, memberId: string) => client.request<ProjectTask>(`${taskPath(organizationId, projectId, taskId)}/assign`, { method: "PATCH", body: JSON.stringify({ memberId }) }),
  deleteTask: (organizationId: string, projectId: string, taskId: string) => client.request<null>(taskPath(organizationId, projectId, taskId), { method: "DELETE" }),
  moveTask: (organizationId: string, projectId: string, taskId: string, statusId: string) => client.request<ProjectTask>(taskPath(organizationId, projectId, taskId), { method: "PATCH", body: JSON.stringify({ statusId }) }),
  getSprints: (organizationId: string, projectId: string) => client.request<Sprint[]>(`${projectPath(organizationId, projectId)}/sprints`),
  createSprint: (organizationId: string, projectId: string, input: { name: string; startDate?: string; endDate?: string; status?: string }) => client.request<Sprint>(`${projectPath(organizationId, projectId)}/sprints`, { method: "POST", body: JSON.stringify(input) }),
  updateSprint: (organizationId: string, projectId: string, sprintId: string, input: { name?: string; startDate?: string; endDate?: string; status?: string }) => client.request<Sprint>(`${projectPath(organizationId, projectId)}/sprints/${sprintId}`, { method: "PATCH", body: JSON.stringify(input) }),
  deleteSprint: (organizationId: string, projectId: string, sprintId: string) => client.request<null>(`${projectPath(organizationId, projectId)}/sprints/${sprintId}`, { method: "DELETE" }),
  getTaskAttachments: (organizationId: string, projectId: string, taskId: string) => client.request<TaskAttachment[]>(`${taskPath(organizationId, projectId, taskId)}/attachments`),
  addTaskAttachment: (organizationId: string, projectId: string, taskId: string, input: { name: string; url: string; mimeType?: string; size?: string }) => client.request<TaskAttachment>(`${taskPath(organizationId, projectId, taskId)}/attachments`, { method: "POST", body: JSON.stringify(input) }),
  removeTaskAttachment: (organizationId: string, projectId: string, taskId: string, attachmentId: string) => client.request<null>(`${taskPath(organizationId, projectId, taskId)}/attachments/${attachmentId}`, { method: "DELETE" }),
};
