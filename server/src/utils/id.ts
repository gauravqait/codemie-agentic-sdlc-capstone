export function createId(): string {
  // Good enough for MVP; replace with UUID if needed
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
