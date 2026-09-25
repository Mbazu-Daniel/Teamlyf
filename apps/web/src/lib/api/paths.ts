/** Paths omit the /api/v1 prefix — the client base URL carries it. */
export const projectPath = (organizationId: string, projectId?: string) =>
  projectId
    ? `/organization/${organizationId}/projects/${projectId}`
    : `/organization/${organizationId}/projects`;

export const taskPath = (organizationId: string, projectId: string, taskId?: string) =>
  taskId
    ? `${projectPath(organizationId, projectId)}/tasks/${taskId}`
    : `${projectPath(organizationId, projectId)}/tasks`;
