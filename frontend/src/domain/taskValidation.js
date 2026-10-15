import { PRIORITIES, STATUSES } from './taskModel.js';

/**
 * @typedef {import('./taskModel.js').TaskStatus} TaskStatus
 * @typedef {import('./taskModel.js').TaskPriority} TaskPriority
 *
 * @typedef {Object} TaskFormValues
 * @property {string} title
 * @property {string} description
 * @property {TaskStatus} status
 * @property {TaskPriority} priority
 * @property {string} dueDate
 */

/** @typedef {Partial<Record<keyof TaskFormValues, string>>} TaskFormErrors */

export function emptyFormValues() {
  return {
    title: '',
    description: '',
    status: 'To Do',
    priority: 'Medium',
    dueDate: '',
  };
}

/**
 * @param {TaskFormValues} values
 * @returns {TaskFormErrors}
 */
export function validateTaskForm(values) {
  /** @type {TaskFormErrors} */
  const errors = {};

  const title = values.title.trim();
  if (!title) errors.title = 'Title is required.';
  if (title.length > 100) errors.title = 'Title must be 100 characters or fewer.';

  if (!STATUSES.includes(values.status)) errors.status = 'Invalid status.';
  if (!PRIORITIES.includes(values.priority)) errors.priority = 'Invalid priority.';

  if (values.dueDate) {
    // Expect yyyy-mm-dd from <input type="date">
    const ok = /^\d{4}-\d{2}-\d{2}$/.test(values.dueDate);
    if (!ok) errors.dueDate = 'Due date must be a valid date.';
  }

  return errors;
}

/**
 * @param {TaskFormErrors} errors
 * @returns {keyof TaskFormValues | null}
 */
export function firstErrorField(errors) {
  return (
    Object.keys(errors).find((k) => Boolean(errors[/** @type {keyof TaskFormValues} */ (k)])) ?? null
  );
}
