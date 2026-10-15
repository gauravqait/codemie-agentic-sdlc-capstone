import { describe, expect, it, vi } from 'vitest';
import { loadTasks, saveTasks } from '../infra/storage';

describe('storage adapter', () => {
  it('loadTasks returns empty list when key missing', () => {
    vi.spyOn(window.localStorage.__proto__, 'getItem').mockReturnValueOnce(null);
    const result = loadTasks();
    expect(result.tasks).toEqual([]);
  });

  it('loadTasks handles corrupted JSON', () => {
    vi.spyOn(window.localStorage.__proto__, 'getItem').mockReturnValueOnce('{bad json');
    const result = loadTasks();
    expect(result.tasks).toEqual([]);
    expect(result.error).toMatch(/corrupted/i);
  });

  it('saveTasks handles setItem throw', () => {
    vi.spyOn(window.localStorage.__proto__, 'setItem').mockImplementationOnce(() => {
      throw new Error('QuotaExceeded');
    });
    const result = saveTasks([{ id: '1', title: 'A', status: 'To Do', createdAt: Date.now() }]);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/could not save/i);
  });
});
