import { useEffect, useId, useMemo, useRef, useState } from 'react';
import * as taskModel from './taskModel';

const STATUSES = taskModel.STATUSES ?? ['To Do', 'In Progress', 'Done'];
const EMPTY = taskModel.EMPTY ?? { title: '', description: '', status: 'To Do' };

const STORAGE_KEY = 'tasks';

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function toText(value) {
  return typeof value === 'string' ? value : '';
}

function isValidStatus(status) {
  return STATUSES.includes(status);
}

function validateField(field, rawValue) {
  const value = field === 'status' ? rawValue : toText(rawValue);

  switch (field) {
    case 'title': {
      const title = value.trim();
      if (!title) return 'Title is required.';
      if (title.length > 120) return 'Title must be 120 characters or less.';
      return '';
    }
    case 'description': {
      const description = value.trim();
      if (description.length > 500) return 'Description must be 500 characters or less.';
      return '';
    }
    case 'status': {
      if (!isValidStatus(value)) return 'Please choose a valid status.';
      return '';
    }
    default:
      return '';
  }
}

function validateForm(form) {
  const errors = {
    title: validateField('title', form.title),
    description: validateField('description', form.description),
    status: validateField('status', form.status),
  };
  return errors;
}

function firstInvalidField(errors) {
  if (errors.title) return 'title';
  if (errors.description) return 'description';
  if (errors.status) return 'status';
  return null;
}

function normalizeImportedTask(t) {
  const title = toText(t?.title);
  const description = toText(t?.description);
  const status = isValidStatus(t?.status) ? t.status : EMPTY.status;

  const now = Date.now();
  const id = typeof t?.id === 'number' ? t.id : now + Math.floor(Math.random() * 1000);

  const createdAt = typeof t?.createdAt === 'number' ? t.createdAt : now;
  const updatedAt = typeof t?.updatedAt === 'number' ? t.updatedAt : createdAt;

  return { id, title, description, status, createdAt, updatedAt };
}

function normalizeStoredTasks(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map(normalizeImportedTask)
    .filter((t) => t.title.trim().length > 0);
}

function mergeById(existing, incoming) {
  const byId = new Map(existing.map((t) => [t.id, t]));
  for (const t of incoming) {
    const prev = byId.get(t.id);
    if (!prev) {
      byId.set(t.id, t);
      continue;
    }
    // Prefer newer updatedAt when merging
    byId.set(t.id, prev.updatedAt >= t.updatedAt ? prev : t);
  }
  return Array.from(byId.values());
}

function formatWhen(ts) {
  if (typeof ts !== 'number') return '';
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return '';
  }
}

export default function App() {
  const titleId = useId();
  const descriptionId = useId();
  const statusId = useId();
  const liveRegionId = useId();

  const titleRef = useRef(null);
  const descriptionRef = useRef(null);
  const statusRef = useRef(null);

  const [tasks, setTasks] = useState(() => {
    const parsed = safeParse(localStorage.getItem(STORAGE_KEY));
    return normalizeStoredTasks(parsed ?? []);
  });

  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);

  const [errors, setErrors] = useState({ title: '', description: '', status: '' });
  const [statusMessage, setStatusMessage] = useState('');

  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sort, setSort] = useState('updatedDesc'); // updatedDesc | createdDesc | titleAsc | statusAsc

  const [importText, setImportText] = useState('');
  const [importMode, setImportMode] = useState('merge'); // merge | replace

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = tasks;

    if (filterStatus !== 'All') {
      list = list.filter((t) => t.status === filterStatus);
    }

    if (q) {
      list = list.filter((t) => {
        const haystack = `${t.title} ${t.description} ${t.status}`.toLowerCase();
        return haystack.includes(q);
      });
    }

    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sort) {
        case 'createdDesc':
          return b.createdAt - a.createdAt;
        case 'titleAsc':
          return a.title.localeCompare(b.title);
        case 'statusAsc':
          return a.status.localeCompare(b.status);
        case 'updatedDesc':
        default:
          return b.updatedAt - a.updatedAt;
      }
    });

    return sorted;
  }, [tasks, query, filterStatus, sort]);

  const hasActiveFilters = query.trim() !== '' || filterStatus !== 'All';

  function focusField(field) {
    if (field === 'title') titleRef.current?.focus();
    if (field === 'description') descriptionRef.current?.focus();
    if (field === 'status') statusRef.current?.focus();
  }

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
  }

  function change(field) {
    return (e) => setField(field, e.target.value);
  }

  function reset() {
    setForm(EMPTY);
    setEditingId(null);
    setErrors({ title: '', description: '', status: '' });
    setStatusMessage('');
  }

  function edit(task) {
    setForm({ title: task.title, description: task.description, status: task.status });
    setEditingId(task.id);
    setErrors({ title: '', description: '', status: '' });
    setStatusMessage(`Editing "${task.title}".`);
    titleRef.current?.focus();
  }

  function remove(task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    if (editingId === task.id) reset();
    setStatusMessage(`Deleted "${task.title}".`);
  }

  function submit(e) {
    e.preventDefault();

    const nextErrors = validateForm(form);
    setErrors(nextErrors);

    const firstInvalid = firstInvalidField(nextErrors);
    if (firstInvalid) {
      setStatusMessage('Please fix the highlighted fields.');
      focusField(firstInvalid);
      return;
    }

    const now = Date.now();

    if (editingId) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingId
            ? taskModel.update?.(t, { ...form, updatedAt: now }) ??
              {
                ...t,
                ...form,
                updatedAt: now,
              }
            : t,
        ),
      );
      setStatusMessage('Task updated.');
    } else {
      const created = taskModel.create?.(form) ?? {
        id: now,
        createdAt: now,
        updatedAt: now,
        ...form,
      };
      // Ensure required persisted fields
      const persisted = {
        id: typeof created.id === 'number' ? created.id : now,
        createdAt: typeof created.createdAt === 'number' ? created.createdAt : now,
        updatedAt: typeof created.updatedAt === 'number' ? created.updatedAt : now,
        title: toText(created.title).trim(),
        description: toText(created.description),
        status: isValidStatus(created.status) ? created.status : EMPTY.status,
      };

      setTasks((prev) => [persisted, ...prev]);
      setStatusMessage('Task added.');
    }

    reset();
  }

  function onExport() {
    const payload = JSON.stringify(tasks, null, 2);
    setImportText(payload);
    setStatusMessage('Exported tasks to the JSON box below.');
  }

  function onImport() {
    const parsed = safeParse(importText);
    if (!parsed) {
      setStatusMessage('Import failed: invalid JSON.');
      return;
    }

    const incoming = normalizeStoredTasks(Array.isArray(parsed) ? parsed : parsed?.tasks);

    if (incoming.length === 0) {
      setStatusMessage('Import completed: no valid tasks found in JSON.');
      return;
    }

    setTasks((prev) => {
      const next =
        importMode === 'replace' ? incoming : mergeById(prev, incoming);

      return next;
    });

    setStatusMessage(
      importMode === 'replace'
        ? `Imported ${incoming.length} tasks (replaced existing).`
        : `Imported ${incoming.length} tasks (merged).`,
    );
  }

  const titleErrorId = `${titleId}-error`;
  const descriptionErrorId = `${descriptionId}-error`;
  const statusErrorId = `${statusId}-error`;

  return (
    <main>
      <h1>Task Manager</h1>

      <p id={liveRegionId} role="status" aria-live="polite">
        {statusMessage}
      </p>

      <section aria-label="Task form">
        <form onSubmit={submit}>
          <label htmlFor={titleId}>
            Title
            <input
              id={titleId}
              ref={titleRef}
              value={form.title}
              onChange={change('title')}
              aria-invalid={errors.title ? 'true' : 'false'}
              aria-describedby={errors.title ? titleErrorId : undefined}
              required
            />
          </label>
          {errors.title && (
            <p id={titleErrorId} role="alert">
              {errors.title}
            </p>
          )}

          <label htmlFor={descriptionId}>
            Description
            <textarea
              id={descriptionId}
              ref={descriptionRef}
              value={form.description}
              onChange={change('description')}
              aria-invalid={errors.description ? 'true' : 'false'}
              aria-describedby={errors.description ? descriptionErrorId : undefined}
            />
          </label>
          {errors.description && (
            <p id={descriptionErrorId} role="alert">
              {errors.description}
            </p>
          )}

          <label htmlFor={statusId}>
            Status
            <select
              id={statusId}
              ref={statusRef}
              value={form.status}
              onChange={change('status')}
              aria-invalid={errors.status ? 'true' : 'false'}
              aria-describedby={errors.status ? statusErrorId : undefined}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          {errors.status && (
            <p id={statusErrorId} role="alert">
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
      </section>

      <section aria-label="Task controls">
        <h2>Browse</h2>
        <div>
          <label>
            Search
            <input value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>

          <label>
            Filter status
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="All">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label>
            Sort
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="updatedDesc">Recently updated</option>
              <option value="createdDesc">Recently created</option>
              <option value="titleAsc">Title (A–Z)</option>
              <option value="statusAsc">Status (A–Z)</option>
            </select>
          </label>

          {(hasActiveFilters || sort !== 'updatedDesc') && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setFilterStatus('All');
                setSort('updatedDesc');
                setStatusMessage('Cleared search/filter/sort.');
              }}
            >
              Clear
            </button>
          )}
        </div>
      </section>

      <section aria-label="Import and export">
        <h2>Import / Export</h2>
        <div>
          <button type="button" onClick={onExport}>
            Export JSON
          </button>
        </div>

        <label>
          Import mode
          <select value={importMode} onChange={(e) => setImportMode(e.target.value)}>
            <option value="merge">Merge (by id)</option>
            <option value="replace">Replace all</option>
          </select>
        </label>

        <label>
          JSON
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={8}
            spellCheck={false}
          />
        </label>

        <div>
          <button type="button" onClick={onImport}>
            Import JSON
          </button>
        </div>
      </section>

      <section aria-label="Task list">
        {tasks.length === 0 ? (
          <div>
            <h2>No tasks yet</h2>
            <p>Add your first task using the form above.</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div>
            <h2>No matching tasks</h2>
            <p>Try clearing your search/filter settings.</p>
          </div>
        ) : (
          <>
            <h2>
              Tasks <small>({filteredTasks.length})</small>
            </h2>
            <ul aria-label="Tasks">
              {filteredTasks.map((task) => (
                <li key={task.id}>
                  <div>
                    <strong>{task.title}</strong> <small>({task.status})</small>
                    {task.description && <p>{task.description}</p>}
                    <small>
                      Created: {formatWhen(task.createdAt)}
                      {' · '}
                      Updated: {formatWhen(task.updatedAt)}
                    </small>
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
          </>
        )}
      </section>
    </main>
  );
}
