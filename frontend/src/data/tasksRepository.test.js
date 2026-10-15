import { describe, it, expect, beforeEach, vi } from 'vitest';
import { tasksRepository } from './tasksRepository';
import { STORAGE_KEY } from './storageAdapter';

const makeLocalStorageMock = () => {
  let store = new Map();
  return {
    getItem: vi.fn((k) => (store.has(k) ? store.get(k) : null)),
    setItem: vi.fn((k, v) => store.set(k, String(v))),
    removeItem: vi.fn((k) => store.delete(k)),
    clear: vi.fn(() => store.clear()),
  };
};

describe('tasksRepository', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: makeLocalStorageMock(),
      configurable: true
    });
    localStorage.clear();
  });

  it('getAll returns empty array when storage is empty', () => {
    expect(tasksRepository.getAll()).toEqual([]);
  });

  it('create adds task and persists', () => {
    const created = tasksRepository.create({
      title: 'Test Task',
      description: 'Test description',
      status: 'To Do'
    });

    expect(created).toMatchObject({
      title: 'Test Task',
      status: 'To Do'
    });
    expect(created.id).toBeTruthy();
    expect(created.createdAt).toBeTruthy();

    const all = tasksRepository.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(created.id);
  });

  it('update modifies task and persists', () => {
    const created = tasksRepository.create({
      title: 'Original',
      description: '',
      status: 'To Do'
    });

    const updated = tasksRepository.update(created.id, {
      title: 'Updated'
    });

    expect(updated.title).toBe('Updated');
    expect(updated.id).toBe(created.id);
    expect(updated.createdAt).toBe(created.createdAt);

    const all = tasksRepository.getAll();
    expect(all[0].title).toBe('Updated');
  });

  it('update returns null for non-existent id', () => {
    const result = tasksRepository.update('nonexistent', { title: 'Test' });
    expect(result).toBeNull();
  });

  it('remove deletes task and persists', () => {
    const created = tasksRepository.create({
      title: 'To Delete',
      description: '',
      status: 'To Do'
    });

    const removed = tasksRepository.remove(created.id);
    expect(removed).toBe(true);

    const all = tasksRepository.getAll();
    expect(all).toHaveLength(0);
  });

  it('remove returns false for non-existent id', () => {
    const result = tasksRepository.remove('nonexistent');
    expect(result).toBe(false);
  });

  it('migrates legacy array format to envelope', () => {
    const legacyData = [
      { id: '1', title: 'Legacy Task', description: '', status: 'To Do' }
    ];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacyData));

    const tasks = tasksRepository.getAll();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Legacy Task');
  });

  it('normalizes tasks with missing fields', () => {
    const invalidData = {
      version: 1,
      tasks: [
        { title: 'Incomplete', status: 'INVALID_STATUS' }
      ]
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(invalidData));

    const tasks = tasksRepository.getAll();
    expect(tasks[0].id).toBeTruthy();
    expect(tasks[0].status).toBe('To Do');
    expect(tasks[0].createdAt).toBeTruthy();
  });
});
