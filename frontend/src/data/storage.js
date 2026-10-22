import { STORAGE_KEY, LEGACY_STORAGE_KEYS, STATUS_VALUES, DEFAULT_STATUS } from '../domain/constants';
import { newId } from '../utils/id';

const isValidDate = (v) => typeof v === 'string' && !Number.isNaN(Date.parse(v));

/**
 * Normalizes one stored record. Legacy records missing timestamps get the migration time
 * as createdAt, and updatedAt = createdAt. Returns null for unusable records.
 */
export function normalizeTask(raw, nowIso) {
  if (!raw || typeof raw !== 'object' || typeof raw.title !== 'string' || !raw.title.trim()) {
    return null;
  }
  const createdAt = isValidDate(raw.createdAt) ? raw.createdAt : nowIso;
  const updatedAt = isValidDate(raw.updatedAt) ? raw.updatedAt : createdAt;
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : newId(),
    title: raw.title.trim(),
    description: typeof raw.description === 'string' ? raw.description : '',
    status: STATUS_VALUES.includes(raw.status)
      ? raw.status
      : raw.completed === true
        ? 'done'
        : DEFAULT_STATUS,
    createdAt,
    updatedAt,
  };
}

function readRaw(storage) {
  const current = storage.getItem(STORAGE_KEY);
  if (current !== null) return { raw: current, legacy: false };
  for (const key of LEGACY_STORAGE_KEYS) {
    const value = storage.getItem(key);
    if (value !== null) return { raw: value, legacy: true };
  }
  return { raw: null, legacy: false };
}

/** Never throws. Returns { tasks, error } where error is a user-friendly message or ''. */
export function loadTasks(storage = globalThis.localStorage, now = new Date()) {
  let raw;
  let legacy;
  try {
    ({ raw, legacy } = readRaw(storage));
  } catch {
    return { tasks: [], error: 'Saved tasks could not be read. Changes may not be saved.' };
  }
  if (raw === null) return { tasks: [], error: '' };

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { tasks: [], error: 'Saved tasks were corrupted and could not be loaded. Starting with an empty list.' };
  }
  if (!Array.isArray(parsed)) {
    return { tasks: [], error: 'Saved tasks were in an unexpected format. Starting with an empty list.' };
  }

  const nowIso = now.toISOString();
  const tasks = parsed.map((r) => normalizeTask(r, nowIso)).filter(Boolean);
  const migrated = legacy || tasks.length !== parsed.length || JSON.stringify(tasks) !== JSON.stringify(parsed);
  if (migrated) saveTasks(tasks, storage); // persist migrated result once
  return { tasks, error: '' };
}

/** Never throws. Returns true on success. */
export function saveTasks(tasks, storage = globalThis.localStorage) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return true;
  } catch {
    return false;
  }
}
