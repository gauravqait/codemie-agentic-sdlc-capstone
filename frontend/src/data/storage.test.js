import { describe, it, expect, vi } from 'vitest';
import { loadTasks, saveTasks } from './storage';
import { STORAGE_KEY } from '../domain/constants';

const NOW = new Date('2025-03-01T00:00:00Z');

describe('loadTasks', () => {
  it('returns an empty list for empty storage', () => {
    expect(loadTasks(localStorage, NOW)).toEqual({ tasks: [], error: '' });
  });

  it('migrates legacy tasks missing timestamps and persists once', () => {
    localStorage.setItem('tasks', JSON.stringify([{ id: 'a', title: 'Old task', completed: true }]));
    const { tasks, error } = loadTasks(localStorage, NOW);
    expect(error).toBe('');
    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({
      id: 'a',
      title: 'Old task',
      status: 'done',
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
    });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual(tasks);
  });

  it('preserves existing timestamps', () => {
    const t = { id: 'a', title: 'Keep', description: '', status: 'todo',
      createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-02-01T00:00:00.000Z' };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([t]));
    expect(loadTasks(localStorage, NOW).tasks).toEqual([t]);
  });

  it('recovers from corrupt JSON without throwing', () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    const { tasks, error } = loadTasks(localStorage, NOW);
    expect(tasks).toEqual([]);
    expect(error).toMatch(/corrupted/i);
  });

  it('recovers from a non-array payload', () => {
    localStorage.setItem(STORAGE_KEY, '{"a":1}');
    expect(loadTasks(localStorage, NOW).error).toMatch(/unexpected format/i);
  });

  it('drops unusable records but keeps valid ones', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([null, { title: '' }, { title: 'Good' }]));
    const { tasks } = loadTasks(localStorage, NOW);
    expect(tasks.map((t) => t.title)).toEqual(['Good']);
  });

  it('does not throw when storage access fails', () => {
    const broken = { getItem: () => { throw new Error('denied'); } };
    const { tasks, error } = loadTasks(broken, NOW);
    expect(tasks).toEqual([]);
    expect(error).toBeTruthy();
  });
});

describe('saveTasks', () => {
  it('returns false instead of throwing when quota is exceeded', () => {
    const full = { setItem: vi.fn(() => { throw new Error('QuotaExceededError'); }) };
    expect(saveTasks([], full)).toBe(false);
  });
});
