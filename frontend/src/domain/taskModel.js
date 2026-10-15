export const STATUSES = /** @type {const} */ (['To Do', 'In Progress', 'Done']);
export const PRIORITIES = /** @type {const} */ (['Low', 'Medium', 'High']);

/**
 * @typedef {'To Do' | 'In Progress' | 'Done'} TaskStatus
 * @typedef {'Low' | 'Medium' | 'High'} TaskPriority
 *
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {TaskStatus} status
 * @property {TaskPriority} priority
 * @property {string | undefined} dueDate  // yyyy-mm-dd (from <input type="date">)
 * @property {string} createdAt // ISO datetime
 * @property {string} updatedAt // ISO datetime
 */

export function nowIso() {
  return new Date().toISOString();
}

/**
 * @param {Partial<Task> & Pick<Task,'title'>} input
 * @returns {Task}
 */
export function createTask(input) {
  const ts = nowIso();
  return {
    id: crypto.randomUUID?.() ?? String(Date.now()),
    title: input.title,
    description: input.description ?? '',
    status: input.status ?? 'To Do',
    priority: input.priority ?? 'Medium',
    dueDate: input.dueDate || undefined,
    createdAt: input.createdAt ?? ts,
    updatedAt: input.updatedAt ?? ts,
  };
}

/**
 * @param {Task} task
 * @param {Partial<Omit<Task,'id'|'createdAt'>>} patch
 * @returns {Task}
 */
export function updateTask(task, patch) {
  return {
    ...task,
    ...patch,
    dueDate: patch.dueDate === '' ? undefined : patch.dueDate ?? task.dueDate,
    updatedAt: nowIso(),
  };
}
