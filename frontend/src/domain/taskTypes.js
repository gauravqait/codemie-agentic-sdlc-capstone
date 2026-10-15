export const STATUSES = ['To Do', 'In Progress', 'Done'];

/**
 * @typedef {'To Do' | 'In Progress' | 'Done'} TaskStatus
 */

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {TaskStatus} status
 * @property {string} createdAt ISO string
 * @property {string} updatedAt ISO string
 */

export const EMPTY_FORM = { title: '', description: '', status: 'To Do' };
