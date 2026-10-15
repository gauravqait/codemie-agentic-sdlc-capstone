import { useMemo, useState } from 'react';
import { TicketPriorities, TicketStatuses } from '../models/ticket';

export default function TicketForm({
  initialValues,
  mode, // 'create' | 'edit'
  allowedStatuses,
  onSubmit,
  submitting,
  serverFieldErrors
}) {
  const [title, setTitle] = useState(initialValues.title ?? '');
  const [description, setDescription] = useState(initialValues.description ?? '');
  const [priority, setPriority] = useState(initialValues.priority ?? 'Medium');
  const [status, setStatus] = useState(initialValues.status ?? 'Open');
  const [requester, setRequester] = useState(initialValues.requester ?? '');
  const [assignee, setAssignee] = useState(initialValues.assignee ?? '');

  const [clientErrors, setClientErrors] = useState({});

  const statusOptions = useMemo(() => {
    if (mode === 'create') return ['Open'];
    return allowedStatuses?.length ? allowedStatuses : TicketStatuses;
  }, [allowedStatuses, mode]);

  function validate() {
    const errs = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (title.trim().length > 100) errs.title = 'Title must be at most 100 characters';
    if (description.trim().length > 2000) errs.description = 'Description must be at most 2000 characters';
    if (requester.trim().length > 100) errs.requester = 'Requester must be at most 100 characters';
    if (assignee.trim().length > 100) errs.assignee = 'Assignee must be at most 100 characters';
    setClientErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      title: title.trim(),
      description: description.trim(),
      priority,
      requester: requester.trim(),
      assignee: assignee.trim()
    };

    if (mode === 'edit') payload.status = status;

    onSubmit(payload);
  }

  const fieldError = (name) => serverFieldErrors?.[name] || clientErrors?.[name];

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, maxWidth: 720 }}>
      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
        {fieldError('title') ? <div style={{ color: 'crimson' }}>{fieldError('title')}</div> : null}
      </label>

      <label>
        Description
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} />
        {fieldError('description') ? <div style={{ color: 'crimson' }}>{fieldError('description')}</div> : null}
      </label>

      <label>
        Priority
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          {TicketPriorities.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>

      {mode === 'edit' ? (
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label>
        Requester (optional)
        <input value={requester} onChange={(e) => setRequester(e.target.value)} />
        {fieldError('requester') ? <div style={{ color: 'crimson' }}>{fieldError('requester')}</div> : null}
      </label>

      <label>
        Assignee (optional)
        <input value={assignee} onChange={(e) => setAssignee(e.target.value)} />
        {fieldError('assignee') ? <div style={{ color: 'crimson' }}>{fieldError('assignee')}</div> : null}
      </label>

      <div style={{ display: 'flex', gap: 12 }}>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}
