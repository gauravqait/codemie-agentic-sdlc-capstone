function fallbackId() {
  // good-enough fallback for older browsers/test envs
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createTaskId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return fallbackId();
}

export function nowIso() {
  return new Date().toISOString();
}

export function createTask(formValues, now = nowIso()) {
  return {
    id: createTaskId(),
    title: formValues.title,
    description: formValues.description ?? '',
    status: formValues.status,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateTask(existing, patch, now = nowIso()) {
  return {
    ...existing,
    ...patch,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: now,
  };
}
