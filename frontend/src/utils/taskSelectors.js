/**
 * @param {Array<{title:string, description:string, status:string}>} tasks
 * @param {{query:string, statusFilter:string}} params
 */
export function selectVisibleTasks(tasks, { query, statusFilter }) {
  const q = (query ?? '').trim().toLowerCase();

  return tasks.filter((t) => {
    const matchesStatus = statusFilter === 'All' ? true : t.status === statusFilter;
    if (!matchesStatus) return false;

    if (!q) return true;
    const haystack = `${t.title ?? ''} ${t.description ?? ''}`.toLowerCase();
    return haystack.includes(q);
  });
}
