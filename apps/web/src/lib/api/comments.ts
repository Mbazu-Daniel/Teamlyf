import { client } from "./client";
import { taskPath } from "./paths";

export type Comment = {
  id: string;
  taskId: string;
  parentId: string | null;
  actorId: string;
  body: string | null;
  createdAt: string;
  updatedAt: string;
};

const commentsPath = (organizationId: string, projectId: string, taskId: string, commentId?: string) =>
  commentId
    ? `${taskPath(organizationId, projectId, taskId)}/comments/${commentId}`
    : `${taskPath(organizationId, projectId, taskId)}/comments`;

export const commentsApi = {
  getComments(organizationId: string, projectId: string, taskId: string) {
    return client.request<Comment[]>(commentsPath(organizationId, projectId, taskId));
  },
  createComment(
    organizationId: string,
    projectId: string,
    taskId: string,
    input: { body: string; parentId?: string },
  ) {
    return client.request<Comment>(commentsPath(organizationId, projectId, taskId), {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  updateComment(
    organizationId: string,
    projectId: string,
    taskId: string,
    commentId: string,
    input: { body: string },
  ) {
    return client.request<Comment>(commentsPath(organizationId, projectId, taskId, commentId), {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },
  deleteComment(organizationId: string, projectId: string, taskId: string, commentId: string) {
    return client.request<null>(commentsPath(organizationId, projectId, taskId, commentId), {
      method: "DELETE",
    });
  },
};
