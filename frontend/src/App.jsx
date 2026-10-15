import { useEffect, useMemo, useRef, useState } from 'react';

import { TASK_STATUS_VALUES } from './utils/constants.js';
import { loadTasks, saveTasks } from './services/storage.js';
import { createTask, updateTask } from './utils/taskModel.js';
import { selectVisibleTasks } from './utils/taskSelectors.js';
import { validateTaskDraft } from './utils/validation.js';

const EMPTY_FORM = {
  title: '',
  description: '',
  status: TASK_STATUS_VALUES[0],
};

export default function App() {
  const [tasks, setTasks] = useState(() => loadTasks());

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(/** @type {string | null} */ (null));

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [fieldErrors, setFieldErrors] = useState(/** @type {Record<string, string>} */ ({}));

  const titleRef = useRef(/** @type {HTMLInputElement | null} */ (null));
  const descriptionRef = useRef(/** @type {HTMLTextAreaElement | null} */ (null));
  const statusRef = useRef(/** @type {HTMLSelectElement | null} */ (null));

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  const visibleTasks = useMemo(
    () => selectVisibleTasks(tasks, { query, statusFilter }),
    [tasks, query, statusFilter],
  );

  const change = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));

    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  function focusFirstInvalid(nextErrors) {
    if (nextErrors.title) return titleRef.current?.focus();
    if (nextErrors.description) return descriptionRef.current?.focus();
    if (nextErrors.status) return statusRef.current?.focus();
  }

  function reset() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFieldErrors({});
  }

  function submit(e) {
    e.preventDefault();

    const { isValid, fieldErrors: nextErrors, normalized } = validateTaskDraft(form);

    if (!isValid) {
      setFieldErrors(nextErrors);
      focusFirstInvalid(nextErrors);
      return;
    }

    if (editingId) {
      setTasks((prev) => prev.map((t) => (t.id === editingId ? updateTask(t, normalized) : t)));
    } else {
      setTasks((prev) => [createTask(normalized), ...prev]);
    }

    reset();
    titleRef.current?.focus();
  }

  function edit(task) {
    setForm({
      title: task.title ?? '',
      description: task.description ?? '',
      status: task.status ?? TASK_STATUS_VALUES[0],
    });
    setEditingId(task.id);
    setFieldErrors({});
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

  const titleErrorId = fieldErrors.title ? 'title-error' : undefined;
  const descriptionErrorId = fieldErrors.description ? 'description-error' : undefined;
  const statusErrorId = fieldErrors.status ? 'status-error' : undefined;

  return (
    <main>
      <h1>Task Manager</h1>

      <form onSubmit={submit} aria-label="Task form" noValidate>
        <label>
          Title
          <input
            ref={titleRef}
            value={form.title}
            onChange={change('title')}
            aria-invalid={Boolean(fieldErrors.title)}
            aria-describedby={titleErrorId}
          />
        </label>
        {fieldErrors.title && (
          <p id="title-error" role="alert">
            {fieldErrors.title}
          </p>
        )}

        <label>
          Description
          <textarea
            ref={descriptionRef}
            value={form.description}
            onChange={change('description')}
            aria-invalid={Boolean(fieldErrors.description)}
            aria-describedby={descriptionErrorId}
          />
        </label>
        {fieldErrors.description && (
          <p id="description-error" role="alert">
            {fieldErrors.description}
          </p>
        )}

        <label>
          Status
          <select
            ref={statusRef}
            value={form.status}
            onChange={change('status')}
            aria-invalid={Boolean(fieldErrors.status)}
            aria-describedby={statusErrorId}
          >
            {TASK_STATUS_VALUES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        {fieldErrors.status && (
          <p id="status-error" role="alert">
            {fieldErrors.status}
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