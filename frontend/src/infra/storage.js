import { TASKS_STORAGE_KEY } from '../domain/constants';
import { sanitizeTasks } from '../domain/sanitize';

export function loadTasks() {
  try {
    const raw = window.localStorage.getItem(TASKS_STORAGE_KEY);
    if (!raw) return { tasks: [] };

    try {
      const parsed = JSON.parse(raw);
      const tasks = sanitizeTasks(parsed);
      return { tasks };
    } catch {
      return {
        tasks: [],
        error: 'Saved tasks were corrupted and have been reset.',
      };
    }
  } catch {
    return {
      tasks: [],
      error: 'Storage is unavailable in this browser/session.',
    };
  }
}

export function saveTasks(tasks) {
  try {
    window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: 'Could not save tasks (storage blocked or quota exceeded).',
    };
  }
}
