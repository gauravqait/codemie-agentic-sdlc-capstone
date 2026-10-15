import { ALLOWED_STATUSES, VALIDATION_LIMITS } from './constants.js';

/**
 * Validate a task object
 * @param {Object} task - Task to validate
 * @returns {Object} { isValid: boolean, errors: Object }
 */
export function validateTask({ title, description, status }) {
  const errors = {};

  // Title validation
  const trimmedTitle = (title || '').trim();
  if (!trimmedTitle) {
    errors.title = 'Title is required.';
  } else if (trimmedTitle.length > VALIDATION_LIMITS.TITLE_MAX) {
    errors.title = `Title must be ${VALIDATION_LIMITS.TITLE_MAX} characters or less.`;
  }

  // Description validation
  if (description && description.length > VALIDATION_LIMITS.DESCRIPTION_MAX) {
    errors.description = `Description must be ${VALIDATION_LIMITS.DESCRIPTION_MAX} characters or less.`;
  }

  // Status validation
  if (status && !ALLOWED_STATUSES.includes(status)) {
    errors.status = `Status must be one of: ${ALLOWED_STATUSES.join(', ')}.`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
