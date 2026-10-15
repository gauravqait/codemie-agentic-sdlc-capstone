/**
 * @typedef {import('./taskModel.js').Task} Task
 * @typedef {import('./taskModel.js').TaskStatus} TaskStatus
 * @typedef {import('./taskModel.js').TaskPriority} TaskPriority
 *
 * @typedef {'createdAtDesc' | 'dueDateAsc' | 'priorityDesc' | 'titleAsc' | 'statusAsc'} SortKey
 *
 * @typedef {Object} ListQueryState
 * @property {string} q
 * @property {TaskStatus | 'All'} status
 * @property {TaskPriority | 'All'} priority
 * @property {SortKey} sort
 */

/**
 * @param {Task[]} tasks
 * @param {ListQueryState} state
 * @returns {Task[]}
 */
export function selectVisibleTasks(tasks, state) {
  const q = state.q.trim().toLowerCase();

  let out = tasks;

  if (state.status && state.status !== 'All') {
    out = out.filter((t) => t.status === state.status);
  }
  if (state.priority && state.priority !== 'All') {
    out = out.filter((t) => t.priority === state.priority);
  }
  if (q) {
    out = out.filter((t) => {
      const hay = `${t.title} ${t.description}`.toLowerCase();
      return hay.includes(q);
    });
  }

  const sort = state.sort;
  out = [...out].sort((a, b) => {
    if (sort === 'createdAtDesc') return (b.createdAt || '').localeCompare(a.createdAt || '');
    if (sort === 'dueDateAsc') return (a.dueDate || '9999-99-99').localeCompare(b.dueDate || '9999-99-99');
    if (sort === 'priorityDesc') {
      const rank = { Low: 0, Medium: 1, High: 2 };
      return (rank[b.priority] ?? 0) - (rank[a.priority] ?? 0);
    }
    if (sort === 'statusAsc') return (a.status || '').localeCompare(b.status || '');
    // titleAsc
    return (a.title || '').localeCompare(b.title || '');
  });

  return out;
}
