import { TasksEnvelopeV1Schema, StorageVersion } from './storageSchema.js';
import { migrateToV1, normalizeTasks } from './migrations.js';

/**
 * @typedef {import('../domain/taskModel.js').Task} Task
 */

export const TASKS_STORAGE_KEY = 'tasks';

/**
 * @param {string} raw
 */
function backupCorrupt(raw) {
  try {
    const key = `${TASKS_STORAGE_KEY}__corrupt__${Date.now()}`;
    localStorage.setItem(key, raw);
  } catch {
    // ignore
  }
}

/**
 * @returns {Task[]}
 */
export function loadTasks() {
  const raw = localStorage.getItem(TASKS_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    const migrated = migrateToV1(parsed);
    const normalized = normalizeTasks(migrated.tasks);

    // Validate normalized data. If it doesn't validate, treat as corrupt.
    const envelope = { version: StorageVersion, tasks: normalized };
    const v1 = TasksEnvelopeV1Schema.safeParse(envelope);
    if (!v1.success) {
      backupCorrupt(raw);
      localStorage.removeItem(TASKS_STORAGE_KEY);
      return [];
    }

    // Write back normalized envelope to keep storage consistent.
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(envelope));
    return normalized;
  } catch {
    backupCorrupt(raw);
    localStorage.removeItem(TASKS_STORAGE_KEY);
    return [];
  }
}

/**
 * @param {Task[]} tasks
 */
export function saveTasks(tasks) {
  const envelope = { version: StorageVersion, tasks };
  // Best-effort validate before save; if invalid, don't overwrite.
  const parsed = TasksEnvelopeV1Schema.safeParse(envelope);
  if (!parsed.success) {
    console.warn('Refusing to persist invalid tasks payload', parsed.error);
    return;
  }
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(envelope));
}
