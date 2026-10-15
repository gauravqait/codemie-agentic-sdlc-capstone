import { useEffect, useId, useMemo, useRef, useState } from 'react';

const STATUSES = ['To Do', 'In Progress', 'Done'];
const EMPTY = { title: '', description: '', status: 'To Do' };

const STORAGE_KEY = 'tasks';
const LIMITS = {
  title: 120,
  description: 2000,
};

function safeJsonParse(value) {
  if (typeof value !== 'string' || value.trim() === '') return { ok: true, value: null };
  try {
    return { ok: true, value: JSON.parse(value) };
  } catch (error) {
    return { ok: false, error };
  }
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = safeJsonParse(raw);
    if (!parsed.ok) return { tasks: [], error: 'Saved tasks are corrupted and could not be loaded.' };
    const list = parsed.value ?? [];
    if (!Array.isArray(list)) return { tasks: [], error: 'Saved tasks are in an invalid format and could not be loaded.' };

    const normalized = list
      .filter((t) => t && typeof t === 'object')
      .map((t) => ({
        id: typeof t.id === 'number' ? t.id : Date.now() + Math.floor(Math.random() * 1000),
        title: typeof t.title === 'string' ? t.title : '',
        description: typeof t.description === 'string' ? t.description : '',
        status: STATUSES.includes(t.status) ? t.status : 'To Do',
        createdAt: typeof t.createdAt === 'number' ? t.createdAt : Date.now(),
      }))
      .filter((t) => t.title.trim().length > 0);

    return { tasks: normalized, error: '' };
  } catch {
    return { tasks: [], error: 'Tasks could not be loaded from storage.' };
  }
}

function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return { ok: true };
  } catch {
    return { ok: false, error: 'Tasks could not be saved to storage.' };
  }
}

function normalizeQuery(q) {
  return (q ?? '').toString().trim().toLowerCase();
}

function matchesQuery(task, q) {
  if (!q) return true;
  const haystack = `${task.title ?? ''} ${task.description ?? ''}`.toLowerCase();
  return haystack.includes(q);
}

export default function App() {
  const titleId = useId();
  const descriptionId = useId();
  const statusId = useId();
  const formErrorId = useId();
  const storageBannerId = useId();
  const searchId = useId();
  const filterStatusId = useId();

  const titleRef = useRef(null);

  const [{ tasks: initialTasks, error: initialStorageError }] = useState(() => loadTasks());

  const [tasks, setTasks] = useState(initialTasks);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);

  const [formError, setFormError] = useState('');
  const [storageError, setStorageError] = useState(initialStorageError);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const res = saveTasks(tasks);
    if (!res.ok) setStorageError(res.error);
  }, [tasks]);

  useEffect(() => {
    if (initialStorageError) setStorageError(initialStorageError);
  }, [initialStorageError]);

  const visibleTasks = useMemo(() => {
    const q = normalizeQuery(query);
    return tasks.filter((t) => {
      if (statusFilter !== 'All' && t.status !== statusFilter) return false;
      return matchesQuery(t, q);
    });
  }, [tasks, query, statusFilter]);

  const change = (field) => (e) => {
    const value = e?.target?.value ?? '';
    setForm((prev) => ({ ...prev, [field]: value }));
    if (formError) setFormError('');
  };

  function validate(nextForm) {
    const title = (nextForm.title ?? '').trim();
    const description = (nextForm.description ?? '').toString();

    if (!title) return { ok: false, error: 'Title is required.', field: 'title' };
    if (title.length > LIMITS.title)
      return { ok: false, error: `Title must be at most ${LIMITS.title} characters.`, field: 'title' };
    if (description.length > LIMITS.description)
      return { ok: false, error: `Description must be at most ${LIMITS.description} characters.`, field: 'description' };
    if (!STATUSES.includes(nextForm.status)) return { ok: false, error: 'Status is invalid.', field: 'status' };

    return { ok: true, value: { ...nextForm, title, description } };
  }

  function submit(e) {
    e.preventDefault();
    const validation = validate(form);
    if (!validation.ok) {
      setFormError(validation.error);
      if (validation.field === 'title') {
        requestAnimationFrame(() => titleRef.current?.focus());
      }
      return;
    }

    const task = validation.value;

    setTasks((prev) => {
      if (editingId) {
        return prev.map((t) => (t.id === editingId ? { ...t, ...task } : t));
      }
      return [{ ...task, id: Date.now(), createdAt: Date.now() }, ...prev];
    });

    reset();
  }

  function reset() {
    setForm(EMPTY);
    setEditingId(null);
    setFormError('');
  }

  function edit(task) {
    setForm({
      title: task.title ?? '',
      description: task.description ?? '',
      status: STATUSES.includes(task.status) ? task.status : 'To Do',
    });
    setEditingId(task.id);
    setFormError('');
    requestAnimationFrame(() => titleRef.current?.focus());
  }

  function remove(task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    if (editingId === task.id) reset();
  }

  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Task Manager</h1>

      {storageError && (
        <section
          role="status"
          aria-live="polite"
          id={storageBannerId}
          style={{
            border: '1px solid #b42318',
            background: '#fffbfa',
            color: '#7a271a',
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <strong>Storage issue:</strong> {storageError}
            </div>
            <button type="button" onClick={() => setStorageError('')} aria-label="Dismiss storage message">
              Dismiss
            </button>
          </div>
        </section>
      )}

      <section aria-label="Filters" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <label htmlFor={searchId} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          Search
          <input
            id={searchId}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title/description"
          />
        </label>

        <label htmlFor={filterStatusId} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          Status
          <select id={filterStatusId} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <div style={{ alignSelf: 'end', paddingBottom: 2 }}>
          <small>
            Showing <strong>{visibleTasks.length}</strong> of <strong>{tasks.length}</strong>
          </small>
        </div>
      </section>

      <form onSubmit={submit} aria-label="Task form" aria-describedby={formError ? formErrorId : undefined}>
        <label htmlFor={titleId} style={{ display: 'block', marginBottom: 8 }}>
          Title
        </label>
        <input
          id={titleId}
          ref={titleRef}
          value={form.title}
          onChange={change('title')}
          maxLength={LIMITS.title}
          aria-invalid={formError ? 'true' : 'false'}
          aria-describedby={formError ? formErrorId : undefined}
        />
        <div style={{ marginTop: 4, marginBottom: 12 }}>
          <small>
            {form.title.trim().length}/{LIMITS.title}
          </small>
        </div>

        {formError && (
          <p id={formErrorId} role="alert" style={{ color: '#b42318', marginTop: 0, marginBottom: 12 }}>
            {formError}
          </p>
        )}

        <label htmlFor={descriptionId} style={{ display: 'block', marginBottom: 8 }}>
          Description
        </label>
        <textarea
          id={descriptionId}
          value={form.description}
          onChange={change('description')}
          maxLength={LIMITS.description}
          rows={4}
        />
        <div style={{ marginTop: 4, marginBottom: 12 }}>
          <small>
            {String(form.description ?? '').length}/{LIMITS.description}
          </small>
        </div>

        <label htmlFor={statusId} style={{ display: 'block', marginBottom: 8 }}>
          Status
        </label>
        <select id={statusId} value={form.status} onChange={change('status')}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button type="submit">{editingId ? 'Save' : 'Add'}</button>
          {editingId && (
            <button type="button" onClick={reset}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {visibleTasks.length === 0 && (
        <p style={{ marginTop: 16 }}>
          {tasks.length === 0 ? 'No tasks yet.' : 'No tasks match your filters.'}
        </p>
      )}

      <ul style={{ marginTop: 16, paddingLeft: 18 }}>
        {visibleTasks.map((task) => (
          <li key={task.id} style={{ marginBottom: 12 }}>
            <div>
              <strong>{task.title}</strong> <small>({task.status})</small>
              {typeof task.createdAt === 'number' && (
                <small style={{ marginLeft: 8, color: '#555' }}>
                  {new Date(task.createdAt).toLocaleString()}
                </small>
              )}
              {task.description && <p style={{ marginTop: 6, marginBottom: 6 }}>{task.description}</p>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => edit(task)} aria-label={`Edit ${task.title}`}>
                Edit
              </button>
              <button onClick={() => remove(task)} aria-label={`Delete ${task.title}`}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}