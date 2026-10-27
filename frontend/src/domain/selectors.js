import { FILTER_ALL } from './constants';

/** Case-insensitive "contains" match on title/description, ANDed with the status filter. */
export function filterTasks(tasks, { query = '', status = FILTER_ALL } = {}) {
  const q = query.trim().toLowerCase();
  return tasks.filter((task) => {
    if (status !== FILTER_ALL && task.status !== status) return false;
    if (!q) return true;
    return (
      task.title.toLowerCase().includes(q) ||
      (task.description || '').toLowerCase().includes(q)
    );
  });
}
