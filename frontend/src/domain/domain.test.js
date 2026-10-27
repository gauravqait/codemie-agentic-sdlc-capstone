import { describe, it, expect } from 'vitest';
import { validateTitle } from './validation';
import { filterTasks } from './selectors';
import { createTask, updateTask } from './tasks';

describe('validateTitle', () => {
  it('requires a non-blank title', () => {
    expect(validateTitle('')).toMatch(/required/i);
    expect(validateTitle('    ')).toMatch(/required/i);
    expect(validateTitle(undefined)).toMatch(/required/i);
  });
  it('enforces min and max length after trimming', () => {
    expect(validateTitle(' ab ')).toMatch(/at least 3/);
    expect(validateTitle('a'.repeat(101))).toMatch(/at most 100/);
    expect(validateTitle('  abc  ')).toBe('');
    expect(validateTitle('a'.repeat(100))).toBe('');
  });
});

describe('filterTasks', () => {
  const tasks = [
    { id: '1', title: 'Buy Milk', description: 'from the store', status: 'todo' },
    { id: '2', title: 'Write report', description: 'quarterly MILK sales', status: 'done' },
    { id: '3', title: 'Walk dog', description: '', status: 'done' },
  ];
  it('searches title case-insensitively with contains', () => {
    expect(filterTasks(tasks, { query: 'milk' }).map((t) => t.id)).toEqual(['1', '2']);
    expect(filterTasks(tasks, { query: 'wal' }).map((t) => t.id)).toEqual(['3']);
  });
  it('searches description', () => {
    expect(filterTasks(tasks, { query: 'store' }).map((t) => t.id)).toEqual(['1']);
  });
  it('filters by status and ANDs with search', () => {
    expect(filterTasks(tasks, { status: 'done' }).map((t) => t.id)).toEqual(['2', '3']);
    expect(filterTasks(tasks, { query: 'milk', status: 'done' }).map((t) => t.id)).toEqual(['2']);
  });
  it('returns everything for empty query and "all"', () => {
    expect(filterTasks(tasks, { query: '  ', status: 'all' })).toHaveLength(3);
  });
});

describe('task timestamps', () => {
  it('sets both timestamps on create', () => {
    const t = createTask({ title: ' Hello ' }, new Date('2025-01-01T00:00:00Z'));
    expect(t.title).toBe('Hello');
    expect(t.createdAt).toBe('2025-01-01T00:00:00.000Z');
    expect(t.updatedAt).toBe(t.createdAt);
  });
  it('bumps updatedAt (including status change) and preserves createdAt', () => {
    const t = createTask({ title: 'Hello' }, new Date('2025-01-01T00:00:00Z'));
    const u = updateTask(t, { status: 'done' }, new Date('2025-02-01T00:00:00Z'));
    expect(u.createdAt).toBe(t.createdAt);
    expect(u.updatedAt).toBe('2025-02-01T00:00:00.000Z');
  });
  it('leaves updatedAt alone when nothing changed', () => {
    const t = createTask({ title: 'Hello' }, new Date('2025-01-01T00:00:00Z'));
    expect(updateTask(t, { title: 'Hello' }, new Date('2025-02-01T00:00:00Z'))).toBe(t);
  });
});
