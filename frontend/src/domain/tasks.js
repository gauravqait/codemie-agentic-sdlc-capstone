import { DEFAULT_STATUS, STATUS_VALUES } from './constants';
import { newId } from '../utils/id';

export function createTask({ title, description = '', status = DEFAULT_STATUS }, now = new Date()) {
  const ts = now.toISOString();
  return {
    id: newId(),
    title: title.trim(),
    description: description.trim(),
    status: STATUS_VALUES.includes(status) ? status : DEFAULT_STATUS,
    createdAt: ts,
    updatedAt: ts,
  };
}

/** Any change (including status) bumps updatedAt; createdAt is preserved. */
export function updateTask(task, changes, now = new Date()) {
  const next = { ...task, ...changes };
  if (typeof next.title === 'string') next.title = next.title.trim();
  if (typeof next.description === 'string') next.description = next.description.trim();
  const changed = ['title', 'description', 'status'].some((k) => next[k] !== task[k]);
  return changed ? { ...next, updatedAt: now.toISOString() } : task;
}
