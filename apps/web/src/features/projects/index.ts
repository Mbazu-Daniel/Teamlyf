/**
 * The projects module's public surface. Anything a route or a test needs is
 * re-exported here; components and hooks that only the module itself uses stay
 * internal so the barrel keeps saying what the module is for.
 */
export { ProjectDetailPage } from "./project-detail";
export { ProjectListPage } from "./project-list";
export { StatusColumn } from "./board";
export { TaskDetailPanel } from "./task-detail-panel";
export { useTaskDetail } from "./use-task-detail";
export { parseTaskSearch } from "./task-search";
export { useProjectPage, useProjects } from "./hooks";
export { TaskComments } from "./task-comments";
export { TaskActivity } from "./task-activity";
