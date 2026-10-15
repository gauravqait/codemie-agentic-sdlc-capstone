export const TASK_STATUSES = /** @type {const} */ ({
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
});

export const TASK_STATUS_VALUES = /** @type {const} */ (
  Object.values(TASK_STATUSES)
);

export const STORAGE_KEY_TASKS = 'tasks';

export const VALIDATION_LIMITS = /** @type {const} */ ({
  TITLE_MAX: 100,
  DESCRIPTION_MAX: 500,
});
