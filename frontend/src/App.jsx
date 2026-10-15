import { useEffect, useId, useMemo, useRef, useState } from 'react';
import * as taskModel from './lib/taskModel';

const STATUSES = taskModel.STATUSES;
const LIMITS = taskModel.LIMITS;

const EMPTY = { title: '', description: '', status: STATUSES[0] ?? 'To Do' };

function formatWhen(iso) {
  if (typeof iso !== 'string' || iso.trim() === '') return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString();
}

function firstInvalidField(errors) {
  if (errors?.title) return 'title';
  if (errors?.description) return 'description';
  if (errors?.status) return 'status';
  return '';
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
    // taskModel.loadTasksFromStorage is responsible for migration/normalization.
    return taskModel.loadTasksFromStorage();
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
    taskModel.saveTasksToStorage(tasks);
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
          // ISO 8601 timestamps compare lexicographically.
          return String(b.createdAt).localeCompare(String(a.createdAt));
        case 'titleAsc':
          return a.title.localeCompare(b.title);
        case 'statusAsc':
          return a.status.localeCompare(b.status);
        case 'updatedDesc':
        default:
          // ISO 8601 timestamps compare lexicographically.
          return String(b.updatedAt).localeCompare(String(a.updatedAt));
      }
    });

    return sorted;
  }, [tasks, query, filterStatus, sort]);

  const hasActiveFilters = query.trim() !== '' || filterStatus !== 'All' || sort !== 'updatedDesc';

  function focusField(field) {
    if (field === 'title') titleRef.current?.focus();
    if (field === 'description') descriptionRef.current?.focus();
    if (field === 'status') statusRef.current?.focus();
  }

  function setField(field, value) {
    const nextDraft = { ...form, [field]: value };
    setForm(nextDraft);

    // Keep per-field UX responsive while using taskModel as the source of truth.
    const { errors: nextErrors } = taskModel.validateTaskDraft(nextDraft);
    setErrors((prev) => ({
      ...prev,
      [field]: nextErrors?.[field] ?? '',
    }));
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
    // Only store draft fields in the form state; timestamps remain canonical on the task.
    setForm({ title: task.title, description: task.description, status: task.status });
    setEditingId(String(task.id));
    setErrors({ title: '', description: '', status: '' });
    setStatusMessage(`Editing "${task.title}".`);
    titleRef.current?.focus();
  }

  function remove(task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    setTasks((prev) => prev.filter((t) => t.id !== String(task.id)));
    if (editingId === String(task.id)) reset();
    setStatusMessage(`Deleted "${task.title}".`);
  }

  function submit(e) {
    e.preventDefault();

    const { errors: nextErrors, value } = taskModel.validateTaskDraft(form);
    setErrors({
      title: nextErrors?.title ?? '',
      description: nextErrors?.description ?? '',
      status: nextErrors?.status ?? '',
    });

    const firstInvalid = firstInvalidField(nextErrors);
    if (firstInvalid) {
      setStatusMessage('Please fix the highlighted fields.');
      focusField(firstInvalid);
      return;
    }

    const nowIso = taskModel.nowIso();

    if (editingId) {
      setTasks((prev) =>
        prev.map((t) =>
          String(t.id) === String(editingId)
            ? {
                ...t,
                ...value,
                updatedAt: nowIso,
              }
            : t,
        ),
      );
      setStatusMessage('Task updated.');
    } else {
      const created = {
        id: String(taskModel.generateId()),
        createdAt: nowIso,
        updatedAt: nowIso,
        ...value,
      };

      // Keep insertion consistent with default sort (newest updated first).
      setTasks((prev) => [created, ...prev]);
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
    let parsed;
    try {
      parsed = JSON.parse(importText);
    } catch {
      setStatusMessage('Import failed: invalid JSON.');
      return;
    }

    const raw = Array.isArray(parsed) ? parsed : parsed?.tasks;
    if (!Array.isArray(raw) || raw.length === 0) {
      setStatusMessage('Import completed: no valid tasks found in JSON.');
      return;
    }

    // Normalize/migrate imported tasks as well (do not use storage loader for raw arrays).
    const incoming = taskModel.loadTasks(raw);

    if (!Array.isArray(incoming) || incoming.length === 0) {
      setStatusMessage('Import completed: no valid tasks found in JSON.');
      return;
    }

    setTasks((prev) => {
      if (importMode === 'replace') return incoming;

      const byId = new Map(prev.map((t) => [String(t.id), t]));
      for (const t of incoming) {
        const id = String(t.id);
        const existing = byId.get(id);
        if (!existing) {
          byId.set(id, t);
          continue;
        }
        // Prefer newer updatedAt when merging (ISO strings compare lexicographically)
        byId.set(id, existing.updatedAt >= t.updatedAt ? existing : t);
      }
      return Array.from(byId.values());
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
              maxLength={LIMITS?.descriptionMax ?? 1000}
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
