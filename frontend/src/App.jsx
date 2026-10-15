import { useEffect, useMemo, useRef, useState } from 'react';
import { tasksRepository } from './data/tasksRepository.js';
import { getVisibleTasks } from './domain/selectors/tasks.js';
import { TASK_STATUS, SORT_OPTIONS } from './domain/constants.js';
import { TaskForm } from './components/TaskForm.jsx';
import { TaskList } from './components/TaskList.jsx';
import { TaskControls } from './components/TaskControls.jsx';
import { LiveRegion } from './components/LiveRegion.jsx';

const SCHEMA_VERSION = 2;

const PRIORITY = Object.freeze({
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
});

const EMPTY_FORM = {
  title: '',
  description: '',
  status: TASK_STATUS.TODO,
  priority: PRIORITY.MEDIUM,
};

const INITIAL_FILTERS = {
  status: 'All',
  priority: 'All',
  query: '',
  sort: SORT_OPTIONS.NEWEST,
};

function nowIso() {
  return new Date().toISOString();
}

function ensureTaskSchema(task) {
  const now = nowIso();

  const normalizedStatus = Object.values(TASK_STATUS).includes(task?.status)
    ? task.status
    : TASK_STATUS.TODO;

  const normalizedPriority = Object.values(PRIORITY).includes(task?.priority)
    ? task.priority
    : PRIORITY.MEDIUM;

  const createdAt = typeof task?.createdAt === 'string' && task.createdAt ? task.createdAt : now;
  const updatedAt = typeof task?.updatedAt === 'string' && task.updatedAt ? task.updatedAt : createdAt;

  return {
    ...task,
    status: normalizedStatus,
    priority: normalizedPriority,
    createdAt,
    updatedAt,
  };
}

/**
 * Versioned migration to keep localStorage persistence stable even if existing tasks were stored
 * without the new fields. Uses repository if it supports it; otherwise falls back to best-effort.
 */
function migrateStorageIfNeeded() {
  const STORAGE_KEYS = ['task-manager', 'tasks', 'taskManager', 'task_manager']; // best-effort candidates
  const versionKey = 'task-manager:schemaVersion';

  const readJson = (k) => {
    try {
      const raw = window.localStorage.getItem(k);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const writeJson = (k, v) => {
    try {
      window.localStorage.setItem(k, JSON.stringify(v));
    } catch {
      // ignore storage failures
    }
  };

  const existingVersion = (() => {
    const v = readJson(versionKey);
    if (typeof v === 'number') return v;
    const raw = window.localStorage.getItem(versionKey);
    const n = Number(raw);
    return Number.isFinite(n) ? n : 1;
  })();

  if (existingVersion >= SCHEMA_VERSION) return;

  // Try to migrate by reading from known keys OR by asking repository (if it exposes getAll()).
  let migrated = false;

  for (const key of STORAGE_KEYS) {
    const data = readJson(key);
    if (!data) continue;

    // Common shapes: array, { tasks: [...] }, { items: [...] }
    const tasksArray = Array.isArray(data)
      ? data
      : Array.isArray(data?.tasks)
        ? data.tasks
        : Array.isArray(data?.items)
          ? data.items
          : null;

    if (!tasksArray) continue;

    const nextTasks = tasksArray.map(ensureTaskSchema);
    if (Array.isArray(data)) {
      writeJson(key, nextTasks);
    } else if (Array.isArray(data?.tasks)) {
      writeJson(key, { ...data, tasks: nextTasks, schemaVersion: SCHEMA_VERSION });
    } else if (Array.isArray(data?.items)) {
      writeJson(key, { ...data, items: nextTasks, schemaVersion: SCHEMA_VERSION });
    } else {
      // Shouldn't happen, but keep safe.
      writeJson(key, nextTasks);
    }
    migrated = true;
  }

  // If nothing was migrated via keys, attempt to migrate by using repository read and write back
  // via update calls (best-effort). This preserves whatever key the repository uses.
  if (!migrated) {
    try {
      const existing = tasksRepository.getAll?.() ?? [];
      const patched = existing.map(ensureTaskSchema);

      // If repository exposes a bulk save, use it; otherwise update each task.
      if (typeof tasksRepository.replaceAll === 'function') {
        tasksRepository.replaceAll(patched);
      } else if (typeof tasksRepository.saveAll === 'function') {
        tasksRepository.saveAll(patched);
      } else if (typeof tasksRepository.update === 'function') {
        for (const t of patched) {
          tasksRepository.update(t.id, t);
        }
      }
    } catch {
      // ignore migration failures
    }
  }

  try {
    window.localStorage.setItem(versionKey, String(SCHEMA_VERSION));
  } catch {
    // ignore
  }
}

function validateTaskForm(form) {
  const errors = {};
  const title = (form?.title ?? '').trim();

  if (!title) errors.title = 'Title is required.';
  if (title.length > 100) errors.title = 'Title must be 100 characters or fewer.';

  return { isValid: Object.keys(errors).length === 0, errors };
}

function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

function ConfirmDialog({ open, title, description, confirmLabel = 'Delete', cancelLabel = 'Cancel', onConfirm, onCancel }) {
  const dialogRef = useRef(null);
  const confirmButtonRef = useRef(null);
  const lastActiveRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    lastActiveRef.current = document.activeElement;
    const dialog = dialogRef.current;

    // Focus management: move focus into dialog
    window.setTimeout(() => {
      confirmButtonRef.current?.focus?.();
    }, 0);

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel?.();
        return;
      }

      if (e.key === 'Tab') {
        // Basic focus trap
        const focusable = dialog?.querySelectorAll?.(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [open, onCancel]);

  useEffect(() => {
    if (open) return;
    // Restore focus when closing
    const last = lastActiveRef.current;
    if (last && typeof last.focus === 'function') {
      window.setTimeout(() => last.focus(), 0);
    }
  }, [open]);

  if (!open) return null;

  const onBackdropMouseDown = (e) => {
    // Only close when clicking backdrop, not inside dialog
    if (e.target === e.currentTarget) onCancel?.();
  };

  return (
    <div
      role="presentation"
      className="confirm-backdrop"
      onMouseDown={onBackdropMouseDown}
      aria-hidden="false"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
        className="confirm-dialog"
      >
        <h2 id="confirm-title">{title}</h2>
        <p id="confirm-description">{description}</p>
        <div className="confirm-actions">
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            {cancelLabel}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            className="btn btn-danger"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [liveMessage, setLiveMessage] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [pendingDelete, setPendingDelete] = useState(null);
  const [queryInput, setQueryInput] = useState(INITIAL_FILTERS.query);

  // Debounced keyword search to reduce re-renders/filtering cost.
  const debouncedQuery = useDebouncedValue(queryInput, 250);

  useEffect(() => {
    setFilters((prev) => (prev.query === debouncedQuery ? prev : { ...prev, query: debouncedQuery }));
  }, [debouncedQuery]);

  // Load tasks on mount + migrate schema
  useEffect(() => {
    migrateStorageIfNeeded();
    const loadedTasks = (tasksRepository.getAll?.() ?? []).map(ensureTaskSchema);
    setTasks(loadedTasks);
  }, []);

  // Get visible tasks after applying filters
  const visibleTasks = useMemo(() => {
    const base = getVisibleTasks(tasks, filters);

    const statusFiltered =
      filters.status && filters.status !== 'All'
        ? base.filter((t) => t.status === filters.status)
        : base;

    const priorityFiltered =
      filters.priority && filters.priority !== 'All'
        ? statusFiltered.filter((t) => (t.priority ?? PRIORITY.MEDIUM) === filters.priority)
        : statusFiltered;

    const q = (filters.query ?? '').trim().toLowerCase();
    const searched = q
      ? priorityFiltered.filter((t) => {
          const title = (t.title ?? '').toLowerCase();
          const description = (t.description ?? '').toLowerCase();
          return title.includes(q) || description.includes(q);
        })
      : priorityFiltered;

    const sorted = [...searched];
    const sort = filters.sort;

    const getTime = (iso) => {
      const t = Date.parse(iso);
      return Number.isFinite(t) ? t : 0;
    };

    // Keep compatibility with existing SORT_OPTIONS values; add support for updated sort.
    if (sort === SORT_OPTIONS.OLDEST) {
      sorted.sort((a, b) => getTime(a.createdAt) - getTime(b.createdAt));
    } else if (sort === 'Updated') {
      sorted.sort((a, b) => getTime(b.updatedAt) - getTime(a.updatedAt));
    } else {
      // Default newest
      sorted.sort((a, b) => getTime(b.createdAt) - getTime(a.createdAt));
    }

    return sorted;
  }, [tasks, filters]);

  const handleFormChange = (newForm) => {
    const normalized = ensureTaskSchema(newForm);
    // ensureTaskSchema adds timestamps if missing; we don't want to keep changing timestamps while typing:
    // Strip timestamps for form state; set on submit.
    const { createdAt, updatedAt, ...rest } = normalized;
    setForm((prev) => ({ ...prev, ...rest }));
    if (formErrors.title) {
      const { errors } = validateTaskForm({ ...form, ...rest });
      setFormErrors(errors);
    }
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormErrors({});
  };

  const handleSubmit = () => {
    const { isValid, errors } = validateTaskForm(form);
    setFormErrors(errors);
    if (!isValid) {
      setLiveMessage(errors.title || 'Please fix the errors in the form.');
      return;
    }

    const trimmedTitle = form.title.trim();
    const payload = {
      ...form,
      title: trimmedTitle,
      description: form.description ?? '',
      status: form.status ?? TASK_STATUS.TODO,
      priority: form.priority ?? PRIORITY.MEDIUM,
    };

    if (editingId) {
      // Update existing task
      const updatedPayload = {
        ...payload,
        updatedAt: nowIso(),
      };

      const updated = tasksRepository.update?.(editingId, updatedPayload);

      if (updated) {
        const normalized = ensureTaskSchema(updated);
        setTasks((prev) => prev.map((t) => (t.id === editingId ? normalized : t)));
        setLiveMessage(`Task "${normalized.title}" updated.`);
      } else {
        // Best-effort fallback if repository returns nothing
        setTasks((prev) =>
          prev.map((t) =>
            t.id === editingId
              ? ensureTaskSchema({
                  ...t,
                  ...updatedPayload,
                  updatedAt: updatedPayload.updatedAt,
                })
              : t
          )
        );
        setLiveMessage(`Task "${trimmedTitle}" updated.`);
      }
    } else {
      // Create new task
      const createdPayload = {
        ...payload,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      const created = tasksRepository.create?.(createdPayload);
      const normalized = ensureTaskSchema(created ?? createdPayload);

      setTasks((prev) => [normalized, ...prev]);
      setLiveMessage(`Task "${normalized.title}" created.`);
    }

    resetForm();
  };

  const handleCancel = () => {
    resetForm();
    setLiveMessage('Edit cancelled.');
  };

  const handleEdit = (task) => {
    const normalized = ensureTaskSchema(task);
    setForm({
      title: normalized.title ?? '',
      description: normalized.description ?? '',
      status: normalized.status ?? TASK_STATUS.TODO,
      priority: normalized.priority ?? PRIORITY.MEDIUM,
    });
    setEditingId(normalized.id);
    setFormErrors({});
    setLiveMessage(`Editing task "${normalized.title}".`);
  };

  const requestDelete = (task) => {
    setPendingDelete(ensureTaskSchema(task));
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;

    const task = pendingDelete;
    const success = tasksRepository.remove?.(task.id);

    if (success !== false) {
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      if (editingId === task.id) resetForm();
      setLiveMessage(`Task "${task.title}" deleted.`);
    } else {
      setLiveMessage(`Unable to delete task "${task.title}".`);
    }

    setPendingDelete(null);
  };

  const cancelDelete = () => {
    setPendingDelete(null);
    setLiveMessage('Delete cancelled.');
  };

  const emptyStateTitle = 'No tasks match your filters.';
  const emptyStateBody =
    filters.status !== 'All' || filters.priority !== 'All' || (filters.query ?? '').trim()
      ? 'Try clearing filters or changing your search.'
      : 'Create your first task using the form above.';

  return (
    <main className="app">
      <header>
        <h1>Task Manager</h1>
        <p className="subtitle">Enhanced with filtering, search, and accessibility</p>
      </header>

      <section aria-labelledby="form-heading">
        <h2 id="form-heading">{editingId ? 'Edit Task' : 'Create New Task'}</h2>
        <TaskForm
          form={form}
          onFormChange={handleFormChange}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isEditing={!!editingId}
          errors={formErrors}
          constraints={{ titleMaxLength: 100 }}
          fields={{
            priorityOptions: Object.values(PRIORITY),
          }}
        />
      </section>

      <section aria-labelledby="list-heading">
        <h2 id="list-heading">Tasks ({visibleTasks.length})</h2>
        <TaskControls
          filters={filters}
          onFiltersChange={setFilters}
          queryValue={queryInput}
          onQueryChange={setQueryInput}
          fields={{
            priorityOptions: ['All', ...Object.values(PRIORITY)],
            sortOptions: Array.from(new Set([SORT_OPTIONS.NEWEST, SORT_OPTIONS.OLDEST, 'Updated'])),
          }}
        />

        {visibleTasks.length === 0 ? (
          <div role="status" aria-live="polite" className="empty-state">
            <h3>{emptyStateTitle}</h3>
            <p>{emptyStateBody}</p>
            {(filters.status !== 'All' || filters.priority !== 'All' || (filters.query ?? '').trim()) && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setFilters(INITIAL_FILTERS);
                  setQueryInput(INITIAL_FILTERS.query);
                  setLiveMessage('Filters cleared.');
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <TaskList tasks={visibleTasks} onEdit={handleEdit} onDelete={requestDelete} />
        )}
      </section>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete task?"
        description={
          pendingDelete
            ? `This will permanently delete "${pendingDelete.title}". This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      <LiveRegion message={liveMessage} />
    </main>
  );
}