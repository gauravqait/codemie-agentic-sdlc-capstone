import { describe, expect, it } from 'vitest';
import { sanitizeTask, sanitizeTasks } from '../domain/sanitize';

describe('sanitize', () => {
  it('drops tasks with empty title', () => {
    expect(sanitizeTask({ id: '1', title: '   ', status: 'To Do' })).toBeNull();
  });

  it('defaults invalid status', () => {
    const t = sanitizeTask({ id: '1', title: 'Hello', status: 'BAD' });
    expect(t.status).toBe('To Do');
  });

  it('sanitizes array and sorts newest first', () => {
    const tasks = sanitizeTasks([
      { id: '1', title: 'Old', status: 'To Do', createdAt: 1 },
      { id: '2', title: 'New', status: 'Done', createdAt: 2 },
    ]);
    expect(tasks[0].id).toBe('2');
  });
});
