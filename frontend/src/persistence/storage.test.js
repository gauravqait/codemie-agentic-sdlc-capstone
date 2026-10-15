import { describe, expect, it, vi } from 'vitest';
import { loadState, saveState, STORAGE_KEY, LEGACY_TASKS_KEY } from './storage.js';

describe('persistence/storage', () => {
  it('loads empty state by default', () => {
    const state = loadState();
    expect(state).toEqual({ version: 1, tasks: [] });
  });

  it('saves and loads versioned state', () => {
    saveState({ version: 1, tasks: [{ id: '1', title: 'A', description: '', status: 'To Do', createdAt: 'c', updatedAt: 'u' }] });
    const state = loadState();
    expect(state.version).toBe(1);
    expect(state.tasks).toHaveLength(1);
    expect(state.tasks[0].id).toBe('1');
  });

  it('migrates legacy tasks[] into versioned state and adds fields', () => {
    const legacy = [{ id: 123, title: 'Legacy', description: 'd', status: 'Done' }];
    localStorage.setItem(LEGACY_TASKS_KEY, JSON.stringify(legacy));

    const state = loadState();
    expect(state.version).toBe(1);
    expect(state.tasks).toHaveLength(1);
    expect(state.tasks[0]).toMatchObject({
      id: '123',
      title: 'Legacy',
      description: 'd',
      status: 'Done',
    });
    expect(typeof state.tasks[0].createdAt).toBe('string');
    expect(typeof state.tasks[0].updatedAt).toBe('string');

    // Persisted under new key
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw).version).toBe(1);
  });

  it('handles invalid json without throwing', () => {
    localStorage.setItem(STORAGE_KEY, '{not-json');
    expect(() => loadState()).not.toThrow();
    expect(loadState()).toEqual({ version: 1, tasks: [] });
  });

  it('does not overwrite an invalid stored state when present', () => {
    localStorage.setItem(STORAGE_KEY, '{not-json');
    localStorage.setItem(LEGACY_TASKS_KEY, JSON.stringify([{ id: 1, title: 'Legacy' }]));

    const spy = vi.spyOn(localStorage.__proto__, 'setItem');
    loadState();

    // should not write migrated state when invalid STORAGE_KEY exists
    const wroteStorageKey = spy.mock.calls.some((c) => c[0] === STORAGE_KEY);
    expect(wroteStorageKey).toBe(false);

    spy.mockRestore();
  });
});
