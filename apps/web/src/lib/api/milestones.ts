import { client } from "./client";
import { projectPath } from "./paths";

type MilestoneStatus =
  | "backlog"
  | "planned"
  | "in-progress"
  | "paused"
  | "completed"
  | "cancelled";

type Milestone = {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  status: string;
  startDate: string | null;
  targetDate: string | null;
  createdById: string;
};

type MilestoneTask = {
  id: string;
  milestoneId: string;
  taskId: string;
};

const milestonesPath = (organizationId: string, projectId: string, milestoneId?: string) =>
  milestoneId
    ? `${projectPath(organizationId, projectId)}/milestones/${milestoneId}`
    : `${projectPath(organizationId, projectId)}/milestones`;

const milestoneTaskPath = (
  organizationId: string,
  projectId: string,
  milestoneId: string,
  taskId: string,
) => `${milestonesPath(organizationId, projectId, milestoneId)}/tasks/${taskId}`;

export const milestonesApi = {
  getMilestones(organizationId: string, projectId: string) {
    return client.request<Milestone[]>(milestonesPath(organizationId, projectId));
  },
  createMilestone(
    organizationId: string,
    projectId: string,
    input: {
      name: string;
      description?: string;
      status?: MilestoneStatus;
      startDate?: string;
      targetDate?: string;
    },
  ) {
    return client.request<Milestone>(milestonesPath(organizationId, projectId), {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  updateMilestone(
    organizationId: string,
    projectId: string,
    milestoneId: string,
    input: {
      name?: string;
      description?: string;
      status?: MilestoneStatus;
      startDate?: string;
      targetDate?: string;
    },
  ) {
    return client.request<Milestone>(milestonesPath(organizationId, projectId, milestoneId), {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
  deleteMilestone(organizationId: string, projectId: string, milestoneId: string) {
    return client.request<null>(milestonesPath(organizationId, projectId, milestoneId), {
      method: "DELETE",
    });
  },
  createMilestoneTask(organizationId: string, projectId: string, milestoneId: string, taskId: string) {
    return client.request<MilestoneTask>(milestoneTaskPath(organizationId, projectId, milestoneId, taskId), {
      method: "POST",
    });
  },
  deleteMilestoneTask(organizationId: string, projectId: string, milestoneId: string, taskId: string) {
    return client.request<null>(milestoneTaskPath(organizationId, projectId, milestoneId, taskId), {
      method: "DELETE",
    });
  },
};
