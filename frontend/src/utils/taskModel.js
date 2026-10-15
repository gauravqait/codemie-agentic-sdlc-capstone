import { uuid } from './uuid.js';

export const STATUSES = /** @type {const} */ (['To Do', 'In Progress', 'Done']);
export const DEFAULT_STATUS = 'To Do';
export const TITLE_MAX_LENGTH = 100;

export function isValidStatus(status) {
  return STATUSES.includes(status);
}

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} status
 * @property {string} createdAt ISO string
 * @property {string} updatedAt ISO string
 */

/**
 * Normalize a raw task-like object into the canonical Task shape.
 * Returns null if the task cannot be normalized into a valid shape.
 *
 * @param {any} raw
 * @returns {Task|null}
 */
export function normalizeTask(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const now = new Date().toISOString();
  const id = typeof raw.id === 'string' && raw.id ? raw.id : uuid();

  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  if (!title) return null;
  if (title.length > TITLE_MAX_LENGTH) return null;

  const description = typeof raw.description === 'string' ? raw.description : '';
  const status = isValidStatus(raw.status) ? raw.status : DEFAULT_STATUS;

  const createdAt =
    typeof raw.createdAt === 'string' && !Number.isNaN(Date.parse(raw.createdAt))
      ? raw.createdAt
      : now;
  const updatedAt =
    typeof raw.updatedAt === 'string' && !Number.isNaN(Date.parse(raw.updatedAt))
      ? raw.updatedAt
      : createdAt;

  return { id, title, description, status, createdAt, updatedAt };
}

/**
 * Validate and normalize user input for create/update.
 * Returns {task, errors} where task is safe to persist.
 *
 * @param {{title?: string, description?: string, status?: string}} input
 * @param {{now?: string}} [options]
 */
export function validateTaskInput(input, options = {}) {
  const now = options.now ?? new Date().toISOString();
  const errors = {};

  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (!title) errors.title = 'Title is required.';
  else if (title.length > TITLE_MAX_LENGTH) {
    errors.title = `Title must be ${TITLE_MAX_LENGTH} characters or fewer.`;
  }

  const description = typeof input.description === 'string' ? input.description : '';

  const status = typeof input.status === 'string' ? input.status : DEFAULT_STATUS;
  if (!isValidStatus(status)) errors.status = 'Invalid status.';

  const ok = Object.keys(errors).length === 0;
  return {
    ok,
    errors,
    value: ok ? { title, description, status, updatedAt: now } : null,
  };
}

/**
 * Create a new canonical task from user input.
 * @param {{title: string, description: string, status: string}} input
 */
export function createTask(input) {
  const now = new Date().toISOString();
  return {
    id: uuid(),
    title: input.title.trim(),
    description: input.description ?? '',
    status: isValidStatus(input.status) ? input.status : DEFAULT_STATUS,
    createdAt: now,
    updatedAt: now,
  };
}
