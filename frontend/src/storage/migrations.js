import { createTask, nowIso, PRIORITIES, STATUSES } from '../domain/taskModel.js';
import { LegacyTasksSchema, TasksEnvelopeV1Schema } from './storageSchema.js';

/**
 * @typedef {import('../domain/taskModel.js').Task} Task
 */

/**
 * @param {unknown} input
 * @returns {{version: 1, tasks: Task[]}}
 */
export function migrateToV1(input) {
  // Already v1
  const v1 = TasksEnvelopeV1Schema.safeParse(input);
  if (v1.success) return v1.data;

  // Legacy array
  const legacy = LegacyTasksSchema.safeParse(input);
  if (legacy.success) {
    const ts = nowIso();
    const tasks = legacy.data.map((t) => {
      const status = STATUSES.includes(/** @type {any} */ (t.status)) ? /** @type {any} */ (t.status) : 'To Do';
      const id = String(t.id);
      // Use legacy id for continuity; createdAt/updatedAt default to now.
      return createTask({
        id,
        title: t.title,
        description: t.description ?? '',
        status,
        priority: 'Medium',
        createdAt: ts,
        updatedAt: ts,
      });
    });
    return { version: 1, tasks };
  }

  // Unknown/corrupt → empty
  return { version: 1, tasks: [] };
}

/**
 * Normalize tasks defensively (defaults + field coercion) without throwing.
 *
 * @param {Task[]} tasks
 * @returns {Task[]}
 */
export function normalizeTasks(tasks) {
  const now = nowIso();
  return tasks.map((t) => {
    const status = STATUSES.includes(t.status) ? t.status : 'To Do';
    const priority = PRIORITIES.includes(t.priority) ? t.priority : 'Medium';
    const dueDate = t.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(t.dueDate) ? t.dueDate : undefined;
    return {
      ...t,
      id: String(t.id),
      title: String(t.title ?? '').trim(),
      description: String(t.description ?? ''),
      status,
      priority,
      dueDate,
      createdAt: t.createdAt || now,
      updatedAt: t.updatedAt || now,
    };
  });
}
