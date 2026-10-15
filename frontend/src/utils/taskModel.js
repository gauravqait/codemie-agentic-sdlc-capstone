import { TASK_STATUSES } from './constants.js';
import { generateId } from './uuid.js';

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} status
 * @property {string} createdAt ISO timestamp
 * @property {string} updatedAt ISO timestamp
 */

export function nowIso() {
  return new Date().toISOString();
}

/**
 * Normalize any unknown/legacy task shape into the current Task shape.
 * Returns null if the object can't be treated as a task.
 *
 * @param {any} input
 * @param {() => string} [clock]
 * @returns {Task | null}
 */
export function normalizeTask(input, clock = nowIso) {
  if (!input || typeof input !== 'object') return null;

  const title = typeof input.title === 'string' ? input.title : '';
  const description = typeof input.description === 'string' ? input.description : '';
  const status = Object.values(TASK_STATUSES).includes(input.status)
    ? input.status
    : TASK_STATUSES.TODO;

  // Legacy app used number ids via Date.now(). Keep them but stringify for stability.
  const idRaw = input.id;
  const id = typeof idRaw === 'string' ? idRaw : typeof idRaw === 'number' ? String(idRaw) : generateId();

  const createdAt = typeof input.createdAt === 'string' ? input.createdAt : clock();
  const updatedAt = typeof input.updatedAt === 'string' ? input.updatedAt : createdAt;

  return {
    id,
    title,
    description,
    status,
    createdAt,
    updatedAt,
  };
}

/**
 * Create a new Task from a validated draft.
 *
 * @param {{title:string, description:string, status:string}} draft
 * @param {() => string} [clock]
 */
export function createTask(draft, clock = nowIso) {
  const ts = clock();
  return {
    id: generateId(),
    title: draft.title,
    description: draft.description,
    status: draft.status,
    createdAt: ts,
    updatedAt: ts,
  };
}

/**
 * Apply updates to an existing Task.
 *
 * @param {Task} task
 * @param {{title:string, description:string, status:string}} draft
 * @param {() => string} [clock]
 */
export function updateTask(task, draft, clock = nowIso) {
  return {
    ...task,
    title: draft.title,
    description: draft.description,
    status: draft.status,
    updatedAt: clock(),
  };
}
