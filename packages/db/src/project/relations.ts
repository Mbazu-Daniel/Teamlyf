import { relations } from "drizzle-orm";
import { project } from "./project";
import { status } from "./status";
import { label } from "./label";
import { task } from "./task";
import { taskAssignee } from "./task-assignee";
import { taskLabel } from "./task-label";
import { taskActivity } from "./task-activity";
import { taskComment } from "./task-comment";
import { milestone } from "./milestone";
import { milestoneTask } from "./milestone-task";

export const projectRelations = relations(project, ({ many }) => ({
  statuses: many(status),
  labels: many(label),
  tasks: many(task),
  milestones: many(milestone),
}));

export const statusRelations = relations(status, ({ one, many }) => ({
  project: one(project, { fields: [status.projectId], references: [project.id] }),
  tasks: many(task),
}));

export const labelRelations = relations(label, ({ one, many }) => ({
  project: one(project, { fields: [label.projectId], references: [project.id] }),
  parent: one(label, { fields: [label.parentId], references: [label.id], relationName: "label_tree" }),
  children: many(label, { relationName: "label_tree" }),
  taskLabels: many(taskLabel),
}));

export const taskRelations = relations(task, ({ one, many }) => ({
  project: one(project, { fields: [task.projectId], references: [project.id] }),
  status: one(status, { fields: [task.statusId], references: [status.id] }),
  parent: one(task, { fields: [task.parentId], references: [task.id], relationName: "task_tree" }),
  children: many(task, { relationName: "task_tree" }),
  taskAssignees: many(taskAssignee),
  taskLabels: many(taskLabel),
  taskActivities: many(taskActivity),
  taskComments: many(taskComment),
  milestoneTasks: many(milestoneTask),
}));

export const taskAssigneeRelations = relations(taskAssignee, ({ one }) => ({
  task: one(task, { fields: [taskAssignee.taskId], references: [task.id] }),
}));

export const taskLabelRelations = relations(taskLabel, ({ one }) => ({
  task: one(task, { fields: [taskLabel.taskId], references: [task.id] }),
  label: one(label, { fields: [taskLabel.labelId], references: [label.id] }),
}));

export const taskActivityRelations = relations(taskActivity, ({ one }) => ({
  task: one(task, { fields: [taskActivity.taskId], references: [task.id] }),
}));

export const taskCommentRelations = relations(taskComment, ({ one, many }) => ({
  task: one(task, { fields: [taskComment.taskId], references: [task.id] }),
  parent: one(taskComment, {
    fields: [taskComment.parentId],
    references: [taskComment.id],
    relationName: "comment_thread",
  }),
  replies: many(taskComment, { relationName: "comment_thread" }),
}));

export const milestoneRelations = relations(milestone, ({ one, many }) => ({
  project: one(project, { fields: [milestone.projectId], references: [project.id] }),
  milestoneTasks: many(milestoneTask),
}));

export const milestoneTaskRelations = relations(milestoneTask, ({ one }) => ({
  milestone: one(milestone, { fields: [milestoneTask.milestoneId], references: [milestone.id] }),
  task: one(task, { fields: [milestoneTask.taskId], references: [task.id] }),
}));
