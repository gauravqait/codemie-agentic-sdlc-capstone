import { normalizeTask } from '../utils/taskModel.js';

const STORAGE_KEY = 'tasks';
const VERSION = 1;

/**
 * @typedef {{version: number, tasks: any[]}} TasksEnvelope
 */

/**
 * @param {Storage} storage
 */
function getStorage(storage) {
  return storage ?? globalThis.localStorage;
}

/**
 * Load tasks from localStorage with schema versioning and migration.
 * Legacy format support:
 * - v0: a plain array of tasks
 * - v1: { version: 1, tasks: [...] }
 *
 * @param {{storage?: Storage}} [options]
 * @returns {import('../utils/taskModel.js').normalizeTask extends (...args:any)=>infer R ? Exclude<R,null>[] : any[]}
 */
export function loadTasks(options = {}) {
  const storage = getStorage(options.storage);
  let raw;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return [];
  }
  if (!raw) return [];

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  /** @type {TasksEnvelope} */
  let envelope;

  // v0 legacy array
  if (Array.isArray(parsed)) {
    envelope = { version: VERSION, tasks: parsed };
  } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.tasks)) {
    envelope = {
      version: typeof parsed.version === 'number' ? parsed.version : VERSION,
      tasks: parsed.tasks,
    };
  } else {
    return [];
  }

  // Future migrations could be applied based on envelope.version.
  const normalized = [];
  for (const t of envelope.tasks) {
    const n = normalizeTask(t);
    if (n) normalized.push(n);
  }

  return normalized;
}

/**
 * Save tasks in the versioned envelope format.
 * @param {Array<any>} tasks
 * @param {{storage?: Storage}} [options]
 */
export function saveTasks(tasks, options = {}) {
  const storage = getStorage(options.storage);
  const payload = { version: VERSION, tasks };
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota/security errors for this demo
  }
}

export function __storageKeyForTests() {
  return STORAGE_KEY;
}
