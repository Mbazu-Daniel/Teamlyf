/** Paths omit the /api/v1 prefix — the client base URL carries it. */
export const projectPath = (organizationId: string, projectId?: string) =>
  projectId
    ? `/organization/${organizationId}/projects/${projectId}`
    : `/organization/${organizationId}/projects`;

export const taskPath = (organizationId: string, projectId: string, taskId?: string) =>
  taskId
    ? `${projectPath(organizationId, projectId)}/tasks/${taskId}`
    : `${projectPath(organizationId, projectId)}/tasks`;

export const attachmentPath = (
  organizationId: string,
  projectId: string,
  taskId: string,
  attachmentId?: string,
) =>
  attachmentId
    ? `${taskPath(organizationId, projectId, taskId)}/attachments/${attachmentId}`
    : `${taskPath(organizationId, projectId, taskId)}/attachments`;

export const taskRelationPath = (
  organizationId: string,
  projectId: string,
  taskId: string,
  relationId?: string,
) =>
  relationId
    ? `${taskPath(organizationId, projectId, taskId)}/relations/${relationId}`
    : `${taskPath(organizationId, projectId, taskId)}/relations`;

export const taskSubscriberPath = (
  organizationId: string,
  projectId: string,
  taskId: string,
  subscriberMemberId?: string,
) =>
  subscriberMemberId
    ? `${taskPath(organizationId, projectId, taskId)}/subscribers/${subscriberMemberId}`
    : `${taskPath(organizationId, projectId, taskId)}/subscribers`;
