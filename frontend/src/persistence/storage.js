import { createTaskId, nowIso } from '../domain/taskService.js';

export const STORAGE_KEY = 'taskManagerState';
export const LEGACY_TASKS_KEY = 'tasks';
export const CURRENT_VERSION = 1;

function safeParse(json) {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function isStoredStateV1(value) {
  return (
    value &&
    typeof value === 'object' &&
    value.version === 1 &&
    Array.isArray(value.tasks)
  );
}

function normalizeLegacyTask(t) {
  const now = nowIso();
  return {
    id: typeof t?.id === 'string' ? t.id : createTaskId(),
    title: String(t?.title ?? ''),
    description: String(t?.description ?? ''),
    status: t?.status === 'In Progress' || t?.status === 'Done' ? t.status : 'To Do',
    createdAt: typeof t?.createdAt === 'string' ? t.createdAt : now,
    updatedAt: typeof t?.updatedAt === 'string' ? t.updatedAt : now,
  };
}

export function loadState() {
  const parsed = safeParse(localStorage.getItem(STORAGE_KEY));
  if (isStoredStateV1(parsed)) return parsed;

  // Try legacy format: localStorage['tasks'] = Task[]
  const legacy = safeParse(localStorage.getItem(LEGACY_TASKS_KEY));
  if (Array.isArray(legacy)) {
    const migrated = {
      version: CURRENT_VERSION,
      tasks: legacy.map(normalizeLegacyTask),
    };
    saveState(migrated);
    return migrated;
  }

  return { version: CURRENT_VERSION, tasks: [] };
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
