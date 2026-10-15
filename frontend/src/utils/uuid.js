/**
 * Generate a collision-resistant id.
 * Uses crypto.randomUUID when available; falls back to a time+random string.
 */
export function generateId() {
  // eslint-disable-next-line no-undef
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    // eslint-disable-next-line no-undef
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
