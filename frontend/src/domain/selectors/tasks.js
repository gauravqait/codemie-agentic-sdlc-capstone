import { SORT_OPTIONS } from '../constants.js';

/**
 * Get visible tasks after applying filters, search, and sort
 * @param {Array} tasks - All tasks
 * @param {Object} options - { status, query, sort }
 * @returns {Array} Filtered and sorted tasks
 */
export function getVisibleTasks(tasks, { status, query, sort }) {
  let result = [...tasks];

  // Filter by status
  if (status && status !== 'All') {
    result = result.filter((task) => task.status === status);
  }

  // Search
  if (query && query.trim()) {
    const lowerQuery = query.toLowerCase();
    result = result.filter(
      (task) =>
        task.title.toLowerCase().includes(lowerQuery) ||
        (task.description && task.description.toLowerCase().includes(lowerQuery)),
    );
  }

  // Sort
  result = sortTasks(result, sort);

  return result;
}

/**
 * Sort tasks by specified option
 * @param {Array} tasks - Tasks to sort
 * @param {string} sortOption - Sort option
 * @returns {Array} Sorted tasks
 */
function sortTasks(tasks, sortOption) {
  const sorted = [...tasks];

  switch (sortOption) {
    case SORT_OPTIONS.NEWEST:
      return sorted.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0) || b.id.localeCompare(a.id));
    case SORT_OPTIONS.OLDEST:
      return sorted.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0) || a.id.localeCompare(b.id));
    case SORT_OPTIONS.TITLE_ASC:
      return sorted.sort((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
    case SORT_OPTIONS.TITLE_DESC:
      return sorted.sort((a, b) => b.title.localeCompare(a.title) || a.id.localeCompare(b.id));
    default:
      return sorted;
  }
}
