import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { DEFAULT_STATUS, STATUSES, TITLE_MAX_LENGTH } from '../utils/taskModel.js';

const EMPTY = { title: '', description: '', status: DEFAULT_STATUS };

export default function TaskForm({ editingTask, onAdd, onUpdate, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  const titleId = useId();
  const titleErrorId = useId();
  const liveId = useId();
  const titleRef = useRef(null);

  const isEditing = Boolean(editingTask);

  useEffect(() => {
    if (editingTask) {
      setForm({
        title: editingTask.title ?? '',
        description: editingTask.description ?? '',
        status: editingTask.status ?? DEFAULT_STATUS,
      });
      setErrors({});
    } else {
      setForm(EMPTY);
      setErrors({});
    }
  }, [editingTask]);

  const titleDescribedBy = useMemo(() => {
    return errors.title ? titleErrorId : undefined;
  }, [errors.title, titleErrorId]);

  const change = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  function resetAndFocus() {
    setForm(EMPTY);
    setErrors({});
    titleRef.current?.focus();
  }

  async function submit(e) {
    e.preventDefault();

    const action = isEditing ? onUpdate : onAdd;
    const result = await action(form);

    if (!result.ok) {
      setErrors(result.errors ?? { form: 'Could not save task.' });
      if (result.errors?.title) titleRef.current?.focus();
      return;
    }

    resetAndFocus();
  }

  function cancel() {
    setErrors({});
    onCancel?.();
    resetAndFocus();
  }

  return (
    <form onSubmit={submit} aria-label="Task form">
      <div aria-live="polite" id={liveId} style={{ position: 'absolute', left: -9999 }}>
        {errors.form ? errors.form : ''}
      </div>

      <label htmlFor={titleId}>
        Title
        <input
          id={titleId}
          ref={titleRef}
          value={form.title}
          onChange={change('title')}
          required
          maxLength={TITLE_MAX_LENGTH}
          aria-invalid={errors.title ? 'true' : 'false'}
          aria-describedby={titleDescribedBy}
        />
      </label>
      {errors.title && (
        <p role="alert" id={titleErrorId}>
          {errors.title}
        </p>
      )}

      <label>
        Description
        <textarea value={form.description} onChange={change('description')} />
      </label>

      <label>
        Status
        <select value={form.status} onChange={change('status')}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <div>
        <button type="submit">{isEditing ? 'Save' : 'Add'}</button>
        {isEditing && (
          <button type="button" onClick={cancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
