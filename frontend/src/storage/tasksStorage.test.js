import { beforeEach, expect, it } from 'vitest';
import { loadTasks, saveTasks, TASKS_STORAGE_KEY } from './tasksStorage.js';

beforeEach(() => localStorage.clear());

it('migrates legacy array format to versioned envelope and normalizes', () => {
  const legacy = [{ id: 1, title: 'Legacy', description: 'd', status: 'To Do' }];
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(legacy));

  const tasks = loadTasks();
  expect(tasks).toHaveLength(1);
  expect(tasks[0]).toMatchObject({
    id: '1',
    title: 'Legacy',
    status: 'To Do',
    priority: 'Medium',
  });
  expect(tasks[0].createdAt).toBeTruthy();
  expect(tasks[0].updatedAt).toBeTruthy();

  // writes back envelope
  const raw = JSON.parse(localStorage.getItem(TASKS_STORAGE_KEY));
  expect(raw.version).toBe(1);
  expect(Array.isArray(raw.tasks)).toBe(true);
});

it('recovers gracefully from corrupted JSON', () => {
  localStorage.setItem(TASKS_STORAGE_KEY, '{not-json');
  const tasks = loadTasks();
  expect(tasks).toEqual([]);
  expect(localStorage.getItem(TASKS_STORAGE_KEY)).toBe(null);
});

it('saveTasks refuses invalid payload and does not overwrite', () => {
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify({ version: 1, tasks: [] }));
  // @ts-expect-error intentionally invalid
  saveTasks([{ id: 1 }]);
  const raw = JSON.parse(localStorage.getItem(TASKS_STORAGE_KEY));
  expect(raw).toEqual({ version: 1, tasks: [] });
});
