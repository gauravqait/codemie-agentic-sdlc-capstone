export const STATUSES = ['To Do', 'In Progress', 'Done'];

export const STORAGE_KEY = 'tasks';

export const LIMITS = {
  titleMax: 120,
  descriptionMax: 1000,
};

export function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: sufficiently unique for demo/local-only usage
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} status
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * Normalize a raw task-like object from storage/import into a canonical Task.
 * Returns null if the object is not valid enough to recover.
 *
 * @param {any} raw
 * @returns {Task | null}
 */
export function normalizeTask(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  const description = typeof raw.description === 'string' ? raw.description : '';
  const status = STATUSES.includes(raw.status) ? raw.status : 'To Do';

  if (!title) return null;

  const createdAt = typeof raw.createdAt === 'string' ? raw.createdAt : nowIso();
  const updatedAt = typeof raw.updatedAt === 'string' ? raw.updatedAt : createdAt;

  const id = typeof raw.id === 'string' && raw.id ? raw.id : generateId();

  return {
    id,
    title: title.slice(0, LIMITS.titleMax),
    description: description.slice(0, LIMITS.descriptionMax),
    status,
    createdAt,
    updatedAt,
  };
}

/**
 * Migration/backfill for tasks loaded from localStorage.
 * - Accepts old numeric ids
 * - Adds missing createdAt/updatedAt
 * - Drops unrecoverable rows (e.g., missing title)
 *
 * @param {any[]} rawTasks
 * @returns {{ tasks: Task[], migrated: boolean }}
 */
export function migrateTasks(rawTasks) {
  if (!Array.isArray(rawTasks)) return { tasks: [], migrated: true };

  let migrated = false;
  const tasks = [];

  for (const raw of rawTasks) {
    if (!raw || typeof raw !== 'object') {
      migrated = true;
      continue;
    }

    // Support old ids that were numbers.
    const converted = { ...raw };
    if (typeof converted.id === 'number') {
      converted.id = String(converted.id);
      migrated = true;
    }

    const normalized = normalizeTask(converted);
    if (!normalized) {
      migrated = true;
      continue;
    }

    // Detect whether any field was backfilled/changed
    if (
      normalized.id !== converted.id ||
      normalized.createdAt !== converted.createdAt ||
      normalized.updatedAt !== converted.updatedAt ||
      normalized.title !== (typeof converted.title === 'string' ? converted.title.trim() : '') ||
      normalized.description !== (typeof converted.description === 'string' ? converted.description : '') ||
      normalized.status !== converted.status
    ) {
      migrated = true;
    }

    tasks.push(normalized);
  }

  // Newest first by createdAt
  tasks.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return { tasks, migrated };
}

export function loadTasksFromStorage() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const { tasks, migrated } = migrateTasks(raw ?? []);
    if (migrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return tasks;
  } catch {
    return [];
  }
}

export function saveTasksToStorage(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function validateTaskDraft(draft) {
  /** @type {{title?: string, description?: string, status?: string}} */
  const errors = {};

  const title = typeof draft.title === 'string' ? draft.title.trim() : '';
  if (!title) errors.title = 'Title is required.';
  else if (title.length > LIMITS.titleMax) errors.title = `Title must be ${LIMITS.titleMax} characters or less.`;

  const description = typeof draft.description === 'string' ? draft.description : '';
  if (description.length > LIMITS.descriptionMax) {
    errors.description = `Description must be ${LIMITS.descriptionMax} characters or less.`;
  }

  if (!STATUSES.includes(draft.status)) errors.status = 'Status is invalid.';

  return errors;
}
