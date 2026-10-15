import { useRef, useEffect } from 'react';
import { ALLOWED_STATUSES } from '../domain/constants.js';
import { validateTask } from '../domain/validation.js';

/**
 * Task form component with validation and accessibility
 */
export function TaskForm({ form, onFormChange, onSubmit, onCancel, isEditing }) {
  const titleRef = useRef(null);
  const descriptionRef = useRef(null);

  const validation = validateTask(form);
  const errors = validation.errors;

  useEffect(() => {
    // Focus first invalid field or title when form opens
    if (errors.title && titleRef.current) {
      titleRef.current.focus();
    } else if (errors.description && descriptionRef.current) {
      descriptionRef.current.focus();
    }
  }, [errors.title, errors.description]);

  const handleChange = (field) => (e) => {
    onFormChange({ ...form, [field]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validation.isValid) {
      onSubmit();
      // Focus will be managed by parent after successful submit
    }
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Task form" className="task-form">
      <div className="form-group">
        <label htmlFor="task-title">
          Title <span aria-label="required">*</span>
        </label>
        <input
          id="task-title"
          ref={titleRef}
          type="text"
          value={form.title}
          onChange={handleChange('title')}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'title-error' : undefined}
          maxLength={100}
        />
        {errors.title && (
          <p id="title-error" className="error" role="alert">
            {errors.title}
          </p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="task-description">Description</label>
        <textarea
          id="task-description"
          ref={descriptionRef}
          value={form.description}
          onChange={handleChange('description')}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'description-error' : undefined}
          rows={4}
          maxLength={500}
        />
        {errors.description && (
          <p id="description-error" className="error" role="alert">
            {errors.description}
          </p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="task-status">Status</label>
        <select
          id="task-status"
          value={form.status}
          onChange={handleChange('status')}
          aria-invalid={!!errors.status}
          aria-describedby={errors.status ? 'status-error' : undefined}
        >
          {ALLOWED_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        {errors.status && (
          <p id="status-error" className="error" role="alert">
            {errors.status}
          </p>
        )}
      </div>

      <div className="form-actions">
        <button type="submit" disabled={!validation.isValid}>
          {isEditing ? 'Save Changes' : 'Add Task'}
        </button>
        {isEditing && (
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
