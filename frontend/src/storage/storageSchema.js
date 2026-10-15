import { z } from 'zod';
import { PRIORITIES, STATUSES } from '../domain/taskModel.js';

export const StorageVersion = 1;

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().default(''),
  status: z.enum(STATUSES),
  priority: z.enum(PRIORITIES),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Legacy tasks in this repo were {id:number, title, description, status}
export const LegacyTaskSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  description: z.string().optional().default(''),
  status: z.string().optional().default('To Do'),
});

export const LegacyTasksSchema = z.array(LegacyTaskSchema);

export const TasksEnvelopeV1Schema = z.object({
  version: z.literal(1),
  tasks: z.array(TaskSchema),
});
