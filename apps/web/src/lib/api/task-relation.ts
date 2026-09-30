import { client } from "./client";
import { taskRelationPath, taskSubscriberPath } from "./paths";

export const TASK_RELATION_TYPES = ["BLOCKED_BY", "RELATED_TO", "DUPLICATE_OF"] as const;
export type TaskRelationType = (typeof TASK_RELATION_TYPES)[number];

type RelatedTaskRef = {
  id: string;
  name: string;
  sequenceId: number;
};

type TaskRelation = {
  id: string;
  organizationId: string;
  sourceTaskId: string;
  targetTaskId: string;
  relationType: TaskRelationType;
  createdAt: string;
  sourceTask: RelatedTaskRef | null;
  targetTask: RelatedTaskRef | null;
};

type TaskSubscriber = {
  id: string;
  taskId: string;
  organizationId: string;
  memberId: string;
  preferences: Record<string, boolean> | null;
  createdAt: string;
  member: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    userId: string | null;
  } | null;
};

export const taskRelationsApi = {
  getRelations(organizationId: string, projectId: string, taskId: string) {
    return client.request<TaskRelation[]>(taskRelationPath(organizationId, projectId, taskId));
  },
  createRelation(
    organizationId: string,
    projectId: string,
    taskId: string,
    input: { targetTaskId: string; relationType: TaskRelationType },
  ) {
    return client.request<TaskRelation>(taskRelationPath(organizationId, projectId, taskId), {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  deleteRelation(organizationId: string, projectId: string, taskId: string, relationId: string) {
    return client.request<null>(taskRelationPath(organizationId, projectId, taskId, relationId), {
      method: "DELETE",
    });
  },
};

export const taskSubscribersApi = {
  getSubscribers(organizationId: string, projectId: string, taskId: string) {
    return client.request<TaskSubscriber[]>(taskSubscriberPath(organizationId, projectId, taskId));
  },
  subscribe(
    organizationId: string,
    projectId: string,
    taskId: string,
    input: { memberId: string; preferences?: Record<string, boolean> },
  ) {
    return client.request<TaskSubscriber>(taskSubscriberPath(organizationId, projectId, taskId), {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  unsubscribe(organizationId: string, projectId: string, taskId: string, memberId: string) {
    return client.request<null>(taskSubscriberPath(organizationId, projectId, taskId, memberId), {
      method: "DELETE",
    });
  },
};
