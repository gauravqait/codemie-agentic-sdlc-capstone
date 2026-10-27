import { useEffect, useId, useRef, useState } from 'react';
import { STATUSES, DEFAULT_STATUS, DESCRIPTION_MAX } from '../domain/constants';
import { validateTitle } from '../domain/validation';

export default function TaskForm({ initial, submitLabel = 'Add task', onSubmit, onCancel, autoFocus = false }) {
  const uid = useId();
  const titleRef = useRef(null);
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [status, setStatus] = useState(initial?.status ?? DEFAULT_STATUS);
  const [error, setError] = useState('');

  useEffect(() => {
    if (autoFocus) titleRef.current?.focus();
  }, [autoFocus]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const message = validateTitle(title);
    if (message) {
      setError(message);
      titleRef.current?.focus();
      return;
    }
    onSubmit({ title, description, status });
    if (!initial) {
      setTitle('');
      setDescription('');
      setStatus(DEFAULT_STATUS);
      setError('');
      titleRef.current?.focus();
    }
  };

  const errorId = `${uid}-title-error`;
  return (
    <form
      className="task-form"
      onSubmit={handleSubmit}
      noValidate
      onKeyDown={(e) => {
        if (e.key === 'Escape' && onCancel) onCancel();
      }}
    >
      <div className="field">
        <label htmlFor={`${uid}-title`}>Title</label>
        <input
          id={`${uid}-title`}
          ref={titleRef}
          value={title}
          aria-required="true"
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : undefined}
          onChange={(e) => {
            setTitle(e.target.value);
            if (error) setError(validateTitle(e.target.value));
          }}
        />
        {error && (
          <p id={errorId} className="field-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <div className="field">
        <label htmlFor={`${uid}-desc`}>Description (optional)</label>
        <textarea
          id={`${uid}-desc`}
          rows={2}
          maxLength={DESCRIPTION_MAX}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor={`${uid}-status`}>Status</label>
        <select id={`${uid}-status`} value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <div className="actions">
        <button type="submit">{submitLabel}</button>
        {onCancel && (
          <button type="button" className="secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
