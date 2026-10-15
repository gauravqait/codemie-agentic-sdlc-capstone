import { STORAGE_KEY_TASKS } from '../utils/constants.js';
import { normalizeTask } from '../utils/taskModel.js';

const ENVELOPE_VERSION = 1;

/**
 * @param {any} raw
 * @returns {any[]}
 */
function extractTasksArray(raw) {
  // New format: { version: 1, tasks: [...] }
  if (raw && typeof raw === 'object' && Array.isArray(raw.tasks)) return raw.tasks;
  // Legacy format: [ ... ]
  if (Array.isArray(raw)) return raw;
  return [];
}

/**
 * Load tasks from localStorage.
 * - Handles invalid JSON by returning []
 * - Migrates legacy shapes by normalizing tasks
 * - Persists back in the envelope format if migration occurred
 */
export function loadTasks() {
  let parsed;
  try {
    parsed = JSON.parse(localStorage.getItem(STORAGE_KEY_TASKS));
  } catch {
    return [];
  }

  const rawTasks = extractTasksArray(parsed);
  const normalized = rawTasks
    .map((t) => normalizeTask(t))
    .filter(Boolean);

  const envelope = { version: ENVELOPE_VERSION, tasks: normalized };

  // Write back if the persisted shape is not already the current envelope.
  const isCurrentEnvelope =
    parsed && typeof parsed === 'object' && parsed.version === ENVELOPE_VERSION && Array.isArray(parsed.tasks);

  if (!isCurrentEnvelope) {
    try {
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(envelope));
    } catch {
      // Ignore write failures (storage quota, privacy mode)
    }
  }

  return normalized;
}

/**
 * @param {any[]} tasks
 */
export function saveTasks(tasks) {
  const envelope = { version: ENVELOPE_VERSION, tasks };
  localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(envelope));
}
