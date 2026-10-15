/**
 * @typedef {'newest'|'oldest'|'title-asc'|'status'} Sort
 */

/**
 * @param {import('./taskModel.js').STATUSES[number] | 'All'} status
 */
export function isAllStatus(status) {
  return status === 'All';
}

/**
 * @param {Array<any>} tasks
 * @param {{ q: string, status: string, sort: Sort }} params
 */
export function selectVisibleTasks(tasks, params) {
  const q = (params.q ?? '').trim().toLowerCase();
  const status = params.status ?? 'All';

  let filtered = tasks;
  if (status !== 'All') filtered = filtered.filter((t) => t.status === status);
  if (q) {
    filtered = filtered.filter((t) => {
      const title = (t.title ?? '').toLowerCase();
      const desc = (t.description ?? '').toLowerCase();
      return title.includes(q) || desc.includes(q);
    });
  }

  const sort = params.sort ?? 'newest';
  const sorted = [...filtered];
  sorted.sort((a, b) => {
    switch (sort) {
      case 'oldest':
        return Date.parse(a.createdAt) - Date.parse(b.createdAt);
      case 'title-asc':
        return String(a.title).localeCompare(String(b.title));
      case 'status':
        return String(a.status).localeCompare(String(b.status));
      case 'newest':
      default:
        return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    }
  });

  return sorted;
}
