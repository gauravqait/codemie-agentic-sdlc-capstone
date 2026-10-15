/**
 * Generate a unique ID for tasks
 * Uses crypto.randomUUID if available, falls back to timestamp + random
 */
export function generateId() {
  if (globalThis.crypto?.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
