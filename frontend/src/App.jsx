import { useEffect, useMemo, useRef, useState } from 'react';

import { EMPTY_TASK_FORM, STATUSES } from './utils/constants';
import { createTask, updateTaskFields } from './utils/taskModel';
import { selectVisibleTasks } from './utils/selector';
import { taskStorage } from './utils/storage';
import { validateTaskForm } from './utils/validation';

export default function App() {
  const [tasks, setTasks] = useState(() => taskStorage.loadWithMigration());
  const [form, setForm] = useState(EMPTY_TASK_FORM);
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
    taskStorage.save(tasks);
  }, [tasks]);

  const change = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
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

  function submit(e) {
    e.preventDefault();

    const nextErrors = validateTaskForm(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      focusFirstInvalidField(nextErrors);
      return;
    }

    if (editingId) {
      setTasks((prev) =>
        prev.map((t) => (t.id === editingId ? updateTaskFields(t, form) : t)),
      );
    } else {
      setTasks((prev) => [createTask(form), ...prev]);
    }

    reset();

    // After successful add/save, move focus to Title for fast entry
    titleRef.current?.focus();
  }

  function reset() {
    setForm(EMPTY_TASK_FORM);
    setEditingId(null);
    setErrors({});
  }

  function edit(task) {
    // Only edit fields relevant to the form (don't bind id/timestamps into inputs)
    setForm({
      title: task.title ?? '',
      description: task.description ?? '',
      status: task.status ?? EMPTY_TASK_FORM.status,
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
        <div aria-live="polite" aria-atomic="true">
          {/* Field-level errors are announced as they appear */}
        </div>

        <label>
          Title
          <input
            ref={titleRef}
            value={form.title}
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
            value={form.description}
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
            value={form.status}
            onChange={change('status')}
            aria-invalid={Boolean(errors.status)}
            aria-describedby={statusErrorId}
          >
            {STATUSES.map((s) => (
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
            {STATUSES.map((s) => (
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
                <button onClick={() => edit(task)}>Edit</button>
                <button onClick={() => remove(task)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
