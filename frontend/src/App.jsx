import { useEffect, useMemo, useRef, useState } from 'react';

import { TASK_STATUS_VALUES } from './utils/constants';
import { loadTasks, saveTasks } from './services/storage';
import { validateTaskDraft } from './utils/validation';
import { createTask, updateTask } from './utils/taskModel';
import { selectVisibleTasks } from './utils/taskSelectors';

const EMPTY_DRAFT = {
  title: '',
  description: '',
  status: TASK_STATUS_VALUES[0],
};

export default function App() {
  const [tasks, setTasks] = useState(() => loadTasks());

  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState(null);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [errors, setErrors] = useState({});

  const titleRef = useRef(null);
  const descriptionRef = useRef(null);
  const statusRef = useRef(null);

  const visibleTasks = useMemo(
    () => selectVisibleTasks(tasks, { query, status: statusFilter }),
    [tasks, query, statusFilter],
  );

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  const change = (field) => (e) => {
    const value = e.target.value;
    setDraft((prev) => ({ ...prev, [field]: value }));

    setErrors((prev) => {
      if (!prev?.[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const focusFirstInvalidField = (nextErrors) => {
    const order = [
      ['title', titleRef],
      ['description', descriptionRef],
      ['status', statusRef],
    ];

    for (const [field, ref] of order) {
      if (nextErrors?.[field] && ref.current) {
        ref.current.focus();
        return;
      }
    }
  };

  function reset() {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
    setErrors({});
  }

  function submit(e) {
    e.preventDefault();

    const nextErrors = validateTaskDraft(draft);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      focusFirstInvalidField(nextErrors);
      return;
    }

    if (editingId) {
      setTasks((prev) => prev.map((t) => (t.id === editingId ? updateTask(t, draft) : t)));
    } else {
      setTasks((prev) => [createTask(draft), ...prev]);
    }

    reset();
    titleRef.current?.focus();
  }

  function edit(task) {
    setDraft({
      title: task?.title ?? '',
      description: task?.description ?? '',
      status: task?.status ?? EMPTY_DRAFT.status,
    });
    setEditingId(task.id);
    setErrors({});
    titleRef.current?.focus();
  }

  function remove(task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;

    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    if (editingId === task.id) reset();
  }

  const hasAnyTasks = tasks.length > 0;
  const hasVisibleTasks = visibleTasks.length > 0;
  const isFiltered = query.trim() !== '' || statusFilter !== 'All';

  const emptyState = !hasAnyTasks
    ? 'No tasks yet.'
    : !hasVisibleTasks && isFiltered
      ? 'No tasks match your search/filter.'
      : null;

  const titleErrorId = errors.title ? 'title-error' : undefined;
  const descriptionErrorId = errors.description ? 'description-error' : undefined;
  const statusErrorId = errors.status ? 'status-error' : undefined;

  return (
    <main>
      <h1>Task Manager</h1>

      <form onSubmit={submit} aria-label="Task form" noValidate>
        <div aria-live="polite" aria-atomic="true" />

        <label>
          Title
          <input
            ref={titleRef}
            value={draft.title}
            onChange={change('title')}
            aria-invalid={Boolean(errors.title)}
            aria-describedby={titleErrorId}
          />
        </label>
        {errors.title && (
          <p id="title-error" role="alert">
            {errors.title}
          </p>
        )}

        <label>
          Description
          <textarea
            ref={descriptionRef}
            value={draft.description}
            onChange={change('description')}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={descriptionErrorId}
          />
        </label>
        {errors.description && (
          <p id="description-error" role="alert">
            {errors.description}
          </p>
        )}

        <label>
          Status
          <select
            ref={statusRef}
            value={draft.status}
            onChange={change('status')}
            aria-invalid={Boolean(errors.status)}
            aria-describedby={statusErrorId}
          >
            {TASK_STATUS_VALUES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        {errors.status && (
          <p id="status-error" role="alert">
            {errors.status}
          </p>
        )}

        <div>
          <button type="submit">{editingId ? 'Save' : 'Add'}</button>
          {editingId && (
            <button type="button" onClick={reset}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <section aria-label="Task filters">
        <label>
          Search
          <input value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>

        <label>
          Filter by status
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All</option>
            {TASK_STATUS_VALUES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </section>

      {emptyState && <p>{emptyState}</p>}

      {hasVisibleTasks && (
        <ul>
          {visibleTasks.map((task) => (
            <li key={task.id}>
              <div>
                <strong>{task.title}</strong> <small>({task.status})</small>
                {task.description && <p>{task.description}</p>}
              </div>
              <div>
                <button type="button" onClick={() => edit(task)}>
                  Edit
                </button>
                <button type="button" onClick={() => remove(task)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}