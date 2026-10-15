/**
 * Domain constants for Task Manager
 */

export const TASK_STATUS = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

export const ALLOWED_STATUSES = Object.values(TASK_STATUS);

export const SORT_OPTIONS = {
  NEWEST: 'newest',
  OLDEST: 'oldest',
  TITLE_ASC: 'title-asc',
  TITLE_DESC: 'title-desc',
};

export const VALIDATION_LIMITS = {
  TITLE_MAX: 100,
  DESCRIPTION_MAX: 500,
};
