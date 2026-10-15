import { describe, expect, it } from 'vitest';
import { loadTasks, saveTasks, __storageKeyForTests } from './storage.js';

function createMemoryStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
    removeItem(key) {
      map.delete(key);
    },
    clear() {
      map.clear();
    },
  };
}

describe('storage', () => {
  it('returns empty array for missing key', () => {
    const storage = createMemoryStorage();
    expect(loadTasks({ storage })).toEqual([]);
  });

  it('recovers from invalid JSON', () => {
    const storage = createMemoryStorage();
    storage.setItem(__storageKeyForTests(), '{ nope');
    expect(loadTasks({ storage })).toEqual([]);
  });

  it('migrates legacy array format', () => {
    const storage = createMemoryStorage();
    storage.setItem(
      __storageKeyForTests(),
      JSON.stringify([{ id: '1', title: 'T', description: '', status: 'Done' }]),
    );

    const tasks = loadTasks({ storage });
    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({ id: '1', title: 'T', status: 'Done' });
    expect(tasks[0].createdAt).toBeTruthy();
    expect(tasks[0].updatedAt).toBeTruthy();
  });

  it('drops invalid tasks during load', () => {
    const storage = createMemoryStorage();
    storage.setItem(
      __storageKeyForTests(),
      JSON.stringify({ version: 1, tasks: [{ id: '1', title: '' }, { id: '2', title: 'Ok' }] }),
    );

    const tasks = loadTasks({ storage });
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe('2');
  });

  it('saves tasks in versioned envelope format', () => {
    const storage = createMemoryStorage();
    saveTasks([{ id: '1', title: 'X' }], { storage });

    const raw = storage.getItem(__storageKeyForTests());
    expect(raw).toBeTruthy();

    const parsed = JSON.parse(raw);
    expect(parsed.version).toBe(1);
    expect(parsed.tasks).toEqual([{ id: '1', title: 'X' }]);
  });
});
