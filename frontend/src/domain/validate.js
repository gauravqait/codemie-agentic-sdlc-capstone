import { ALLOWED_STATUSES, DESC_MAX, TITLE_MAX } from './constants';

export function validateTaskInput({ title, description, status }) {
  const errors = {};

  const normalizedTitle = String(title ?? '').trim();
  const normalizedDescription = String(description ?? '').trim();

  if (!normalizedTitle) {
    errors.title = 'Title is required.';
  } else if (normalizedTitle.length > TITLE_MAX) {
    errors.title = `Title must be ${TITLE_MAX} characters or fewer.`;
  }

  if (normalizedDescription.length > DESC_MAX) {
    errors.description = `Description must be ${DESC_MAX} characters or fewer.`;
  }

  if (status && !ALLOWED_STATUSES.includes(status)) {
    errors.status = 'Invalid status.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    normalized: {
      title: normalizedTitle,
      description: normalizedDescription,
      status,
    },
  };
}
