import { z } from "zod";

export const TaskStatus = z.enum([
  "TODO",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "ARCHIVED",
]);

export const Priority = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const RepeatPattern = z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]);

export const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  status: TaskStatus.default("TODO"),
  priority: Priority.default("MEDIUM"),
  deadline: z.string().optional().nullable(),
  areaId: z.string().optional().nullable(),
  parentTaskId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).default([]),
  icon: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  repeatEnabled: z.boolean().default(false),
  repeatPattern: RepeatPattern.optional().nullable(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  completedAt: z.string().optional().nullable(),
});

export const createAreaSchema = z.object({
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6366f1"),
  icon: z.string().optional().nullable(),
});

export const updateAreaSchema = createAreaSchema.partial();

export const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6366f1"),
});

export const updateTagSchema = createTagSchema.partial();

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CreateAreaInput = z.infer<typeof createAreaSchema>;
export type UpdateAreaInput = z.infer<typeof updateAreaSchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
