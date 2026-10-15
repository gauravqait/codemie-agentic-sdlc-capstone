import { useEffect, useId, useMemo, useState } from 'react';
import { load, save } from './persistence/storage.js';
import { createTask, updateTask } from './domain/tasks.js';
import { selectVisibleTasks } from './domain/selectors.js';

const STATUSES = ['To Do', 'In Progress', 'Done'];
const EMPTY_FORM = { title: '', description: '', status: 'To Do' };

export default function App() {
  const titleErrorId = useId();
  const descriptionErrorId = useId();
  const statusErrorId = useId();

  const [tasks, setTasks] = useState(() => load());
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const [fieldErrors, setFieldErrors] = useState({
    title: '',
    description: '',
    status: '',
  });

  const [filters, setFilters] = useState({ status: 'All', keyword: '' });

  useEffect(() => {
    save(tasks);
  }, [tasks]);

  const visibleTasks = useMemo(() => selectVisibleTasks(tasks, filters), [tasks, filters]);

  const change = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    // Clear field error on edit for better UX
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev));
  };

  const changeFilter = (field) => (e) =>
    setFilters((prev) => ({ ...prev, [field]: e.target.value }));

  function validate(nextForm) {
    const errors = { title: '', description: '', status: '' };

    const title = nextForm.title.trim();
    if (!title) errors.title = 'Title is required.';

    if (!STATUSES.includes(nextForm.status)) errors.status = 'Invalid status.';

    return { ok: !errors.title && !errors.description && !errors.status, errors, normalizedTitle: title };
  }

  function submit(e) {
    e.preventDefault();

    const { ok, errors, normalizedTitle } = validate(form);
    if (!ok) {
      setFieldErrors(errors);
      return;
    }

    if (editingId) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingId
            ? updateTask(t, { title: normalizedTitle, description: form.description, status: form.status })
            : t,
        ),
      );
    } else {
      setTasks((prev) =>
        [createTask({ title: normalizedTitle, description: form.description, status: form.status }), ...prev],
      );
    }

    reset();
  }

  function reset() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFieldErrors({ title: '', description: '', status: '' });
  }

  function edit(task) {
    // clone into form state to avoid accidental mutations
    setForm({ title: task.title ?? '', description: task.description ?? '', status: task.status ?? 'To Do' });
    setEditingId(task.id);
    setFieldErrors({ title: '', description: '', status: '' });
  }

  function remove(task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    if (editingId === task.id) reset();
  }

  const showNoMatches = tasks.length > 0 && visibleTasks.length === 0;
  const showNoTasks = tasks.length === 0;

  return (
    <main>
      <h1>Task Manager</h1>

      <form onSubmit={submit} aria-label="Task form">
        <label>
          Title
          <input
            value={form.title}
            onChange={change('title')}
            aria-invalid={fieldErrors.title ? 'true' : 'false'}
            aria-describedby={fieldErrors.title ? titleErrorId : undefined}
          />
        </label>
        {fieldErrors.title && (
          <p id={titleErrorId} role="alert">
            {fieldErrors.title}
          </p>
        )}

        <label>
          Description
          <textarea
            value={form.description}
            onChange={change('description')}
            aria-invalid={fieldErrors.description ? 'true' : 'false'}
            aria-describedby={fieldErrors.description ? descriptionErrorId : undefined}
          />
        </label>
        {fieldErrors.description && (
          <p id={descriptionErrorId} role="alert">
            {fieldErrors.description}
          </p>
        )}

        <label>
          Status
          <select
            value={form.status}
            onChange={change('status')}
            aria-invalid={fieldErrors.status ? 'true' : 'false'}
            aria-describedby={fieldErrors.status ? statusErrorId : undefined}
          >
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        {fieldErrors.status && (
          <p id={statusErrorId} role="alert">
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
          Status
          <select value={filters.status} onChange={changeFilter('status')}>
            <option>All</option>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>

        <label>
          Search
          <input
            value={filters.keyword}
            onChange={changeFilter('keyword')}
            placeholder="Search tasks"
          />
        </label>
      </section>

      {showNoTasks && <p>No tasks yet.</p>}
      {showNoMatches && <p>No tasks match your filters.</p>}

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
    </main>
  );
}
