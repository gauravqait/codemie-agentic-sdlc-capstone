export const STORAGE_KEY = 'task-manager.tasks.v2';
export const LEGACY_STORAGE_KEYS = ['task-manager.tasks', 'tasks'];

export const STATUSES = [
  { value: 'todo', label: 'To do' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'done', label: 'Done' },
];
export const STATUS_VALUES = STATUSES.map((s) => s.value);
export const DEFAULT_STATUS = 'todo';
export const FILTER_ALL = 'all';

export const TITLE_MIN = 3;
export const TITLE_MAX = 100;
export const DESCRIPTION_MAX = 500;
