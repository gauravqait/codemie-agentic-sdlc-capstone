import { describe, expect, it } from 'vitest';
import { selectVisibleTasks } from './selectors.js';

describe('selectVisibleTasks', () => {
  const tasks = [
    { id: '1', title: 'Buy milk', description: 'dairy', status: 'To Do' },
    { id: '2', title: 'Fix bug', description: 'urgent', status: 'In Progress' },
    { id: '3', title: 'Read book', description: 'novel', status: 'Done' },
  ];

  it('returns all tasks for default filters', () => {
    expect(selectVisibleTasks(tasks)).toHaveLength(3);
  });

  it('filters by status', () => {
    expect(selectVisibleTasks(tasks, { status: 'Done', query: '' })).toHaveLength(1);
    expect(selectVisibleTasks(tasks, { status: 'Done', query: '' })[0].id).toBe('3');
  });

  it('filters by query across title/description (case-insensitive)', () => {
    expect(selectVisibleTasks(tasks, { status: 'All', query: 'DAIR' })).toHaveLength(1);
    expect(selectVisibleTasks(tasks, { status: 'All', query: 'DAIR' })[0].id).toBe('1');
  });

  it('combines status + query', () => {
    expect(selectVisibleTasks(tasks, { status: 'In Progress', query: 'urgent' })).toHaveLength(1);
    expect(selectVisibleTasks(tasks, { status: 'In Progress', query: 'urgent' })[0].id).toBe('2');
    expect(selectVisibleTasks(tasks, { status: 'Done', query: 'urgent' })).toHaveLength(0);
  });
});
