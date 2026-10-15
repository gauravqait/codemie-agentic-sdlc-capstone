import { useEffect, useId, useMemo, useRef, useState } from 'react';
import ConfirmDialog from './components/ConfirmDialog';
import Toast from './components/Toast';
import { tasksStorage } from './storage/tasksStorage';

const STATUSES = ['To Do', 'In Progress', 'Done'];
const PRIORITIES = ['Low', 'Medium', 'High'];

const EMPTY = {
  title: '',
  description: '',
  status: 'To Do',
  priority: 'Medium',
  dueDate: '',
};

function normalizeStoredTask(t) {
  const now = Date.now();
  return {
    id: t?.id ?? now,
    title: typeof t?.title === 'string' ? t.title : '',
    description: typeof t?.description === 'string' ? t.description : '',
    status: STATUSES.includes(t?.status) ? t.status : 'To Do',
    priority: PRIORITIES.includes(t?.priority) ? t.priority : 'Medium',
    dueDate: typeof t?.dueDate === 'string' ? t.dueDate : '',
    createdAt: typeof t?.createdAt === 'number' ? t.createdAt : now,
    updatedAt: typeof t?.updatedAt === 'number' ? t.updatedAt : now,
  };
}

function containsInsensitive(haystack, needle) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function isValidISODateInput(value) {
  if (!value) return true; // optional
  // HTML date input returns yyyy-mm-dd
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function compare(a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function getDueDateTimestamp(dueDate) {
  if (!dueDate) return Number.POSITIVE_INFINITY;
  const ts = Date.parse(dueDate);
  return Number.isFinite(ts) ? ts : Number.POSITIVE_INFINITY;
}

const PRIORITY_RANK = { Low: 1, Medium: 2, High: 3 };

export default function App() {
  const titleId = useId();
  const descriptionId = useId();
  const statusId = useId();
  const priorityId = useId();
  const dueDateId = useId();

  const titleErrorId = useId();
  const dueDateErrorId = useId();

  const titleInputRef = useRef(null);
  const searchInputRef = useRef(null);

  const [tasks, setTasks] = useState(() => {
    try {
      const loaded = tasksStorage.load?.();
      const arr = Array.isArray(loaded) ? loaded : [];
      return arr.map(normalizeStoredTask);
    } catch {
      return [];
    }
  });

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

  useEffect(() => {
    try {
      tasksStorage.save?.(tasks);
    } catch {
      // ignore persistence errors to avoid breaking UI
    }
  }, [tasks]);

  function validate(nextForm = form) {
    const nextErrors = { title: '', dueDate: '' };

    const title = (nextForm.title ?? '').trim();
    if (!title) nextErrors.title = 'Title is required.';

    if (!isValidISODateInput(nextForm.dueDate ?? '')) nextErrors.dueDate = 'Due date must be a valid date.';

    setErrors(nextErrors);
    return nextErrors;
  }

  function focusFirstError(nextErrors) {
    if (nextErrors.title) {
      titleInputRef.current?.focus();
      return;
    }
    if (nextErrors.dueDate) {
      const el = document.getElementById(dueDateId);
      el?.focus?.();
    }
  }

  const change = (field) => (e) => {
    const value = e.target.value;
    const next = { ...form, [field]: value };

    if (field === 'status') {
      if (editingId) {
        const currentTask = tasks.find((t) => t.id === editingId);
        const previousStatus = currentTask?.status ?? form.status;
        if (previousStatus === 'Done' && value === 'In Progress') {
          setPendingStatusChange({ previousStatus, nextStatus: value });
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

    setForm(next);
    if (field === 'title' || field === 'dueDate') {
      setTouched((t) => ({ ...t, [field]: true }));
      validate(next);
    }
  };

  const onBlur = (field) => () => {
    setTouched((t) => ({ ...t, [field]: true }));
    validate();
  };

  function reset() {
    setForm(EMPTY);
    setEditingId(null);
    setTouched({ title: false, dueDate: false });
    setErrors({ title: '', dueDate: '' });
  }

  function submit(e) {
    e.preventDefault();

    const nextErrors = validate({
      ...form,
      title: (form.title ?? '').trim(),
    });

    setTouched({ title: true, dueDate: true });

    if (nextErrors.title || nextErrors.dueDate) {
      focusFirstError(nextErrors);
      return;
    }

    const now = Date.now();
    const title = form.title.trim();
    const payload = {
      title,
      description: form.description ?? '',
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate ?? '',
      updatedAt: now,
    };

    setTasks((prev) => {
      if (editingId) {
        return prev.map((t) => (t.id === editingId ? { ...t, ...payload } : t));
      }
      const newTask = {
        id: now,
        ...payload,
        createdAt: now,
      };
      return [newTask, ...prev];
    });

    reset();
    titleInputRef.current?.focus();
  }

  function edit(task) {
    const normalized = normalizeStoredTask(task);
    setForm({
      title: normalized.title,
      description: normalized.description,
      status: normalized.status,
      priority: normalized.priority,
      dueDate: normalized.dueDate,
    });
    setEditingId(normalized.id);
    setTouched({ title: false, dueDate: false });
    setErrors({ title: '', dueDate: '' });

    // focus title for editing
    requestAnimationFrame(() => titleInputRef.current?.focus());
  }

  function requestDelete(task) {
    setPendingDelete(task);
    setConfirm({
      open: true,
      title: 'Delete task?',
      message: `Delete "${task.title}"?`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      onConfirm: () => {
        const toDelete = task;
        setTasks((prev) => prev.filter((t) => t.id !== toDelete.id));
        if (editingId === toDelete.id) reset();

        setToast({
          open: true,
          message: `Deleted "${toDelete.title}".`,
          actionLabel: 'Undo',
          durationMs: 6000,
          onAction: () => {
            setTasks((prev) => [normalizeStoredTask(toDelete), ...prev]);
            setToast((t) => ({ ...t, open: false }));
          },
        });

        setPendingDelete(null);
        setConfirm((c) => ({ ...c, open: false, onConfirm: null }));
      },
    });
  }

  function closeConfirm() {
    // If we had a pending status change and user canceled, revert select UI by resetting form.status to previous
    if (pendingStatusChange) {
      setForm((prev) => ({ ...prev, status: pendingStatusChange.previousStatus }));
      setPendingStatusChange(null);
    }
    setPendingDelete(null);
    setConfirm((c) => ({ ...c, open: false, onConfirm: null }));
  }

  const visibleTasks = useMemo(() => {
    let list = tasks;

    const q = search.trim();
    if (q) {
      list = list.filter((t) => {
        const hay = `${t.title ?? ''}\n${t.description ?? ''}`.trim();
        return containsInsensitive(hay, q);
      });
    }

    if (filterStatus !== 'All') {
      list = list.filter((t) => t.status === filterStatus);
    }
    if (filterPriority !== 'All') {
      list = list.filter((t) => t.priority === filterPriority);
    }

    const dir = sortDir === 'asc' ? 1 : -1;
    const sorted = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return compare((a.title ?? '').toLowerCase(), (b.title ?? '').toLowerCase()) * dir;
        case 'status':
          return compare(STATUSES.indexOf(a.status), STATUSES.indexOf(b.status)) * dir;
        case 'priority':
          return compare(PRIORITY_RANK[a.priority] ?? 0, PRIORITY_RANK[b.priority] ?? 0) * dir;
        case 'dueDate':
          return compare(getDueDateTimestamp(a.dueDate), getDueDateTimestamp(b.dueDate)) * dir;
        case 'createdAt':
          return compare(a.createdAt ?? 0, b.createdAt ?? 0) * dir;
        case 'updatedAt':
        default:
          return compare(a.updatedAt ?? 0, b.updatedAt ?? 0) * dir;
      }
    });

    return sorted;
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
              ref={searchInputRef}
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
              <button onClick={() => edit(task)}>Edit</button>
              <button onClick={() => requestDelete(task)}>Delete</button>
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