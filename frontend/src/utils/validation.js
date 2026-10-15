import { TASK_STATUS_VALUES, VALIDATION_LIMITS } from './constants.js';

/**
 * @typedef {{title:string, description:string, status:string}} TaskDraft
 */

/**
 * @param {TaskDraft} draft
 */
export function normalizeDraft(draft) {
  return {
    title: (draft.title ?? '').toString(),
    description: (draft.description ?? '').toString(),
    status: (draft.status ?? '').toString(),
  };
}

/**
 * @param {TaskDraft} draft
 * @returns {{isValid:boolean, fieldErrors: Partial<Record<'title'|'description'|'status', string>>, normalized: TaskDraft}}
 */
export function validateTaskDraft(draft) {
  const normalized = normalizeDraft(draft);
  const fieldErrors = {};

  const titleTrimmed = normalized.title.trim();
  normalized.title = titleTrimmed;

  if (!titleTrimmed) {
    fieldErrors.title = 'Title is required.';
  } else if (titleTrimmed.length > VALIDATION_LIMITS.TITLE_MAX) {
    fieldErrors.title = `Title must be ${VALIDATION_LIMITS.TITLE_MAX} characters or fewer.`;
  }

  if (normalized.description.length > VALIDATION_LIMITS.DESCRIPTION_MAX) {
    fieldErrors.description = `Description must be ${VALIDATION_LIMITS.DESCRIPTION_MAX} characters or fewer.`;
  }

  if (!TASK_STATUS_VALUES.includes(normalized.status)) {
    fieldErrors.status = 'Status is required.';
  }

  return {
    isValid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
    normalized,
  };
}
