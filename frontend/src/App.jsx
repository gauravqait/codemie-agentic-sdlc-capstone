import { useCallback, useId, useMemo, useRef, useState } from 'react';
import ConfirmDialog from './components/ConfirmDialog';
import Toast from './components/Toast';

import { PRIORITIES, STATUSES, createTask, updateTask } from './domain/taskModel.js';
import { validateTaskDraft } from './domain/taskValidation.js';
import { selectVisibleTasks } from './domain/taskSelectors.js';
import { shouldConfirmDoneToInProgress } from './domain/taskTransitions.js';
import { loadTasks, saveTasks } from './storage/tasksStorage.js';

const EMPTY = {
  title: '',
  description: '',
  status: 'To Do',
  priority: 'Medium',
  dueDate: '',
};

function safeLoadTasks() {
  try {
    const loaded = loadTasks?.();
    return Array.isArray(loaded) ? loaded : [];
  } catch {
    return [];
  }
}

function safeSaveTasks(nextTasks) {
  try {
    saveTasks?.(nextTasks);
  } catch {
    // ignore persistence errors to avoid breaking UI
  }
}

export default function App() {
  const titleId = useId();
  const descriptionId = useId();
  const statusId = useId();
  const priorityId = useId();
  const dueDateId = useId();

  const titleErrorId = useId();
  const dueDateErrorId = useId();

  const titleInputRef = useRef(null);
  const dueDateInputRef = useRef(null);

  const [tasks, setTasks] = useState(() => safeLoadTasks());

  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);

  const [touched, setTouched] = useState({ title: false, dueDate: false });
  const [errors, setErrors] = useState({ title: '', dueDate: '' });

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortDir, setSortDir] = useState('desc');

  const [confirm, setConfirm] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    onConfirm: null,
  });

  const [toast, setToast] = useState({
    open: false,
    message: '',
    actionLabel: '',
    onAction: null,
    durationMs: 6000,
  });

  const [pendingStatusChange, setPendingStatusChange] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const applyAndPersistTasks = useCallback((updater) => {
    setTasks((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      safeSaveTasks(next);
      return next;
    });
  }, []);

  const validate = useCallback(
    (nextForm = form) => {
      const nextErrors = validateTaskDraft?.(nextForm) ?? { title: '', dueDate: '' };
      setErrors(nextErrors);
      return nextErrors;
    },
    [form]
  );

  const focusFirstError = useCallback((nextErrors) => {
    if (nextErrors?.title) {
      titleInputRef.current?.focus();
      return;
    }
    if (nextErrors?.dueDate) {
      dueDateInputRef.current?.focus?.();
    }
  }, []);

  const closeConfirm = useCallback(() => {
    if (pendingStatusChange) {
      setForm((prev) => ({ ...prev, status: pendingStatusChange.previousStatus }));
      setPendingStatusChange(null);
    }
    setPendingDelete(null);
    setConfirm((c) => ({ ...c, open: false, onConfirm: null }));
  }, [pendingStatusChange]);

  const reset = useCallback(() => {
    setForm(EMPTY);
    setEditingId(null);
    setTouched({ title: false, dueDate: false });
    setErrors({ title: '', dueDate: '' });
  }, []);

  const change = useCallback(
    (field) => (e) => {
      const value = e.target.value;

      if (field === 'status') {
        const nextStatus = value;

        if (editingId) {
          const currentTask = tasks.find((t) => t.id === editingId);
          const previousStatus = currentTask?.status ?? form.status;

          const needsConfirm =
            shouldConfirmDoneToInProgress?.(previousStatus, nextStatus) ??
            (previousStatus === 'Done' && nextStatus === 'In Progress');

          if (needsConfirm) {
            setPendingStatusChange({ previousStatus, nextStatus });
            setConfirm({
              open: true,
              title: 'Move task back to In Progress?',
              message: 'This task is marked Done. Are you sure you want to move it back to In Progress?',
              confirmLabel: 'Yes, move',
              cancelLabel: 'Keep Done',
              onConfirm: () => {
                setForm((prev) => ({ ...prev, status: 'In Progress' }));
                setPendingStatusChange(null);
                setConfirm((c) => ({ ...c, open: false, onConfirm: null }));
              },
            });
            return;
          }
        }
      }

      const next = { ...form, [field]: value };
      setForm(next);

      if (field === 'title' || field === 'dueDate') {
        setTouched((t) => ({ ...t, [field]: true }));
        validate(next);
      }
    },
    [editingId, form, tasks, validate]
  );

  const onBlur = useCallback(
    (field) => () => {
      setTouched((t) => ({ ...t, [field]: true }));
      validate();
    },
    [validate]
  );

  const submit = useCallback(
    (e) => {
      e.preventDefault();

      const trimmed = { ...form, title: (form.title ?? '').trim() };
      const nextErrors = validate(trimmed);
      setTouched({ title: true, dueDate: true });

      if (nextErrors.title || nextErrors.dueDate) {
        focusFirstError(nextErrors);
        return;
      }

      if (editingId) {
        const updated = updateTask?.(tasks, editingId, trimmed) ?? null;
        if (Array.isArray(updated)) {
          applyAndPersistTasks(updated);
        } else {
          applyAndPersistTasks((prev) => prev.map((t) => (t.id === editingId ? { ...t, ...trimmed } : t)));
        }
      } else {
        const created = createTask?.(trimmed) ?? null;
        if (created) {
          applyAndPersistTasks((prev) => [created, ...prev]);
        } else {
          const now = Date.now();
          applyAndPersistTasks((prev) => [
            {
              id: now,
              ...trimmed,
              createdAt: now,
              updatedAt: now,
            },
            ...prev,
          ]);
        }
      }

      reset();
      titleInputRef.current?.focus();
    },
    [applyAndPersistTasks, editingId, focusFirstError, form, reset, tasks, validate]
  );

  const edit = useCallback((task) => {
    if (!task) return;

    setForm({
      title: typeof task.title === 'string' ? task.title : '',
      description: typeof task.description === 'string' ? task.description : '',
      status: STATUSES.includes(task.status) ? task.status : 'To Do',
      priority: PRIORITIES.includes(task.priority) ? task.priority : 'Medium',
      dueDate: typeof task.dueDate === 'string' ? task.dueDate : '',
    });

    setEditingId(task.id ?? null);
    setTouched({ title: false, dueDate: false });
    setErrors({ title: '', dueDate: '' });

    requestAnimationFrame(() => titleInputRef.current?.focus());
  }, []);

  const requestDelete = useCallback(
    (task) => {
      if (!task) return;

      setPendingDelete(task);
      setConfirm({
        open: true,
        title: 'Delete task?',
        message: `Delete "${task.title}"?`,
        confirmLabel: 'Delete',
        cancelLabel: 'Cancel',
        onConfirm: () => {
          const toDelete = task;

          applyAndPersistTasks((prev) => prev.filter((t) => t.id !== toDelete.id));
          if (editingId === toDelete.id) reset();

          setToast({
            open: true,
            message: `Deleted "${toDelete.title}".`,
            actionLabel: 'Undo',
            durationMs: 6000,
            onAction: () => {
              applyAndPersistTasks((prev) => [toDelete, ...prev]);
              setToast((t) => ({ ...t, open: false }));
            },
          });

          setPendingDelete(null);
          setConfirm((c) => ({ ...c, open: false, onConfirm: null }));
        },
      });
    },
    [applyAndPersistTasks, editingId, reset]
  );

  const visibleTasks = useMemo(() => {
    const params = { search, filterStatus, filterPriority, sortBy, sortDir };
    const selected = selectVisibleTasks?.(tasks, params);
    return Array.isArray(selected) ? selected : tasks;
  }, [tasks, search, filterStatus, filterPriority, sortBy, sortDir]);

  const showTitleError = touched.title && !!errors.title;
  const showDueDateError = touched.dueDate && !!errors.dueDate;

  return (
    <main>
      <h1>Task Manager</h1>

      <section aria-label="Task controls">
        <div>
          <label>
            Search
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title/description"
              aria-label="Search tasks"
            />
          </label>
        </div>

        <div>
          <label>
            Filter status
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} aria-label="Filter by status">
              <option value="All">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label>
            Filter priority
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              aria-label="Filter by priority"
            >
              <option value="All">All</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label>
            Sort by
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort by">
              <option value="updatedAt">Updated</option>
              <option value="createdAt">Created</option>
              <option value="dueDate">Due date</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
              <option value="title">Title</option>
            </select>
          </label>

          <label>
            Direction
            <select value={sortDir} onChange={(e) => setSortDir(e.target.value)} aria-label="Sort direction">
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </label>
        </div>
      </section>

      <form onSubmit={submit} aria-label="Task form" noValidate>
        <label htmlFor={titleId}>Title</label>
        <input
          id={titleId}
          ref={titleInputRef}
          value={form.title}
          onChange={change('title')}
          onBlur={onBlur('title')}
          aria-invalid={showTitleError ? 'true' : 'false'}
          aria-describedby={showTitleError ? titleErrorId : undefined}
        />
        {showTitleError && (
          <p id={titleErrorId} role="alert">
            {errors.title}
          </p>
        )}

        <label htmlFor={descriptionId}>Description</label>
        <textarea id={descriptionId} value={form.description} onChange={change('description')} />

        <label htmlFor={statusId}>Status</label>
        <select id={statusId} value={form.status} onChange={change('status')}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <label htmlFor={priorityId}>Priority</label>
        <select id={priorityId} value={form.priority} onChange={change('priority')}>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <label htmlFor={dueDateId}>Due date</label>
        <input
          id={dueDateId}
          ref={dueDateInputRef}
          type="date"
          value={form.dueDate}
          onChange={change('dueDate')}
          onBlur={onBlur('dueDate')}
          aria-invalid={showDueDateError ? 'true' : 'false'}
          aria-describedby={showDueDateError ? dueDateErrorId : undefined}
        />
        {showDueDateError && (
          <p id={dueDateErrorId} role="alert">
            {errors.dueDate}
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

      {visibleTasks.length === 0 && <p>No tasks yet.</p>}

      <ul aria-label="Task list">
        {visibleTasks.map((task) => (
          <li key={task.id}>
            <div>
              <strong>{task.title}</strong>{' '}
              <small>
                ({task.status} · {task.priority}
                {task.dueDate ? ` · due ${task.dueDate}` : ''})
              </small>
              {task.description && <p>{task.description}</p>}
            </div>
            <div>
              <button type="button" onClick={() => edit(task)}>
                Edit
              </button>
              <button type="button" onClick={() => requestDelete(task)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        confirmLabel={confirm.confirmLabel}
        cancelLabel={confirm.cancelLabel}
        onConfirm={() => confirm.onConfirm?.()}
        onCancel={closeConfirm}
        onClose={closeConfirm}
      />

      <Toast
        open={toast.open}
        message={toast.message}
        actionLabel={toast.actionLabel}
        durationMs={toast.durationMs}
        onAction={toast.onAction}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </main>
  );
}
