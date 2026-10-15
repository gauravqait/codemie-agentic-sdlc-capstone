export function selectVisibleTasks(tasks, { status = 'All', query = '' } = {}) {
  const q = (query ?? '').trim().toLowerCase();

  return tasks.filter((t) => {
    if (status !== 'All' && t?.status !== status) return false;
    if (!q) return true;

    const haystack = `${t?.title ?? ''} ${t?.description ?? ''}`.toLowerCase();
    return haystack.includes(q);
  });
}
