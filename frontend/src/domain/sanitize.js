import { ALLOWED_STATUSES, DEFAULT_STATUS, DESC_MAX, TITLE_MAX } from './constants';

function clampString(value, max) {
  const str = String(value ?? '').trim();
  if (!str) return '';
  return str.length > max ? str.slice(0, max) : str;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function generateId() {
  // good enough for client-side list keys
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function sanitizeTask(raw) {
  if (!isPlainObject(raw)) return null;

  const title = clampString(raw.title, TITLE_MAX);
  if (!title) return null;

  const description = clampString(raw.description ?? '', DESC_MAX);

  const status = ALLOWED_STATUSES.includes(raw.status) ? raw.status : DEFAULT_STATUS;

  const createdAt = Number.isFinite(raw.createdAt) ? raw.createdAt : Date.now();
  const updatedAt = Number.isFinite(raw.updatedAt) ? raw.updatedAt : undefined;

  const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id : generateId();

  return {
    id,
    title,
    description: description || undefined,
    status,
    createdAt,
    ...(updatedAt ? { updatedAt } : {}),
  };
}

export function sanitizeTasks(raw) {
  if (!Array.isArray(raw)) return [];
  const sanitized = raw.map(sanitizeTask).filter(Boolean);
  // newest first
  sanitized.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  return sanitized;
}
