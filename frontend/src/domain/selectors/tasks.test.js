import { describe, it, expect } from 'vitest';
import { getVisibleTasks } from './tasks';
import { ALLOWED_STATUSES, SORT_OPTIONS } from '../constants';

const t = (overrides) => ({
  id: overrides.id ?? 'id',
  title: overrides.title ?? 'Title',
  description: overrides.description ?? '',
  status: overrides.status ?? ALLOWED_STATUSES[0],
  createdAt: overrides.createdAt ?? 1,
  ...overrides,
});

describe('getVisibleTasks', () => {
  it('filters by status', () => {
    const tasks = [
      t({ id: '1', status: ALLOWED_STATUSES[0] }),
      t({ id: '2', status: ALLOWED_STATUSES[1] }),
    ];
    const visible = getVisibleTasks(tasks, { status: ALLOWED_STATUSES[1], query: '', sort: SORT_OPTIONS.NEWEST });
    expect(visible.map(x => x.id)).toEqual(['2']);
  });

  it('filters by query in title (case-insensitive)', () => {
    const tasks = [
      t({ id: '1', title: 'Buy Milk' }),
      t({ id: '2', title: 'Read Book' }),
    ];
    const visible = getVisibleTasks(tasks, { status: 'All', query: 'milk', sort: SORT_OPTIONS.NEWEST });
    expect(visible.map(x => x.id)).toEqual(['1']);
  });

  it('filters by query in description', () => {
    const tasks = [
      t({ id: '1', description: 'alpha beta' }),
      t({ id: '2', description: 'gamma' }),
    ];
    const visible = getVisibleTasks(tasks, { status: 'All', query: 'BETA', sort: SORT_OPTIONS.NEWEST });
    expect(visible.map(x => x.id)).toEqual(['1']);
  });

  it('sorts by newest', () => {
    const tasks = [t({ id: '1', createdAt: 1 }), t({ id: '2', createdAt: 2 })];
    const newest = getVisibleTasks(tasks, { status: 'All', query: '', sort: SORT_OPTIONS.NEWEST });
    expect(newest.map(x => x.id)).toEqual(['2', '1']);
  });

  it('sorts by oldest', () => {
    const tasks = [t({ id: '1', createdAt: 2 }), t({ id: '2', createdAt: 1 })];
    const oldest = getVisibleTasks(tasks, { status: 'All', query: '', sort: SORT_OPTIONS.OLDEST });
    expect(oldest.map(x => x.id)).toEqual(['2', '1']);
  });

  it('sorts by title ascending', () => {
    const tasks = [t({ id: '1', title: 'b' }), t({ id: '2', title: 'a' })];
    const asc = getVisibleTasks(tasks, { status: 'All', query: '', sort: SORT_OPTIONS.TITLE_ASC });
    expect(asc.map(x => x.id)).toEqual(['2', '1']);
  });

  it('sorts by title descending', () => {
    const tasks = [t({ id: '1', title: 'a' }), t({ id: '2', title: 'b' })];
    const desc = getVisibleTasks(tasks, { status: 'All', query: '', sort: SORT_OPTIONS.TITLE_DESC });
    expect(desc.map(x => x.id)).toEqual(['2', '1']);
  });

  it('combines status filter + query + sort', () => {
    const tasks = [
      t({ id: '1', title: 'alpha', status: ALLOWED_STATUSES[0], createdAt: 1 }),
      t({ id: '2', title: 'alpha', status: ALLOWED_STATUSES[1], createdAt: 2 }),
      t({ id: '3', title: 'beta',  status: ALLOWED_STATUSES[1], createdAt: 3 }),
    ];
    const visible = getVisibleTasks(tasks, { status: ALLOWED_STATUSES[1], query: 'alpha', sort: SORT_OPTIONS.NEWEST });
    expect(visible.map(x => x.id)).toEqual(['2']);
  });
});
